"""Execute real Bash state/rollback logic; double only external Docker operations.

Run on Linux (CI or the test runner image). No production Docker resources/env.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

OPS = Path(__file__).resolve().parents[1]
SCRIPT = OPS / "deploy.sh"
FILES = ("compose.yml", "deploy.sh", "image", "revision", "gateway/compose.yml", "gateway/kaizen.caddy")
OLD = "1" * 40
NEW = "2" * 40
IMAGE = "ghcr.io/35harry/kaizen-api@sha256:"


@unittest.skipUnless(os.name == "posix", "Bash deployment tests run in Linux Docker/CI")
class DeployTest(unittest.TestCase):
    def setUp(self):
        self.assertTrue(SCRIPT.is_file(), "Bash deployment tool is missing")
        self.scratch = tempfile.TemporaryDirectory()
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name) / "install"
        (self.root / "config").mkdir(parents=True)
        (self.root / "config/production.env").write_text("MONGODB_URI=mongodb://unchanged.example:27017\n")
        self.bin = Path(self.scratch.name) / "bin"
        self.bin.mkdir()
        docker = self.bin / "docker"
        docker.write_text('''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
args=sys.argv[1:]
image=os.environ.get('KAIZEN_API_IMAGE','')
with open(os.environ['COMMAND_LOG'],'a') as out:
    out.write(json.dumps({'args':args,'image':image})+'\\n')
if 'pull' in args and os.environ.get('FAIL_PULL')=='1': sys.exit(1)
if 'up' in args and os.environ.get('FAIL_UP')=='1': sys.exit(1)
if 'up' in args and image.endswith('b'*64): sys.exit(1)
if 'exec' in args and os.environ.get('FAIL_PROBE')=='1' and image.endswith('c'*64): sys.exit(1)
''')
        docker.chmod(0o755)
        self.log = Path(self.scratch.name) / "commands"
        self.env = {**os.environ, "PATH": f"{self.bin}:{os.environ['PATH']}", "COMMAND_LOG": str(self.log)}

    def release(self, revision=NEW, digest="c"):
        release = self.root / f"incoming-{revision}"
        (release / "gateway").mkdir(parents=True)
        for name in ("compose.yml", "deploy.sh", "gateway/compose.yml", "gateway/kaizen.caddy"):
            shutil.copyfile(OPS / name, release / name)
        (release / "image").write_text(IMAGE + digest * 64 + "\n")
        (release / "revision").write_text(revision + "\n")
        self.checksums(release)
        return release

    def checksums(self, release):
        (release / "checksums.sha256").write_text("".join(
            f"{hashlib.sha256((release / name).read_bytes()).hexdigest()}  {name}\n" for name in FILES))

    def invoke(self, mode, release=None, **env):
        args = ["bash", str(SCRIPT), mode, str(self.root)]
        if release is not None:
            args.append(str(release))
        args.append("https://api.example.test")
        return subprocess.run(args, env={**self.env, **env}, capture_output=True, text=True, timeout=15)

    def commands(self):
        return [json.loads(line) for line in self.log.read_text().splitlines()] if self.log.exists() else []

    def baseline(self):
        result = self.invoke("deploy", self.release(OLD, "a"))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.log.write_text("")

    def test_success_records_release_without_build_or_changing_environment(self):
        result = self.invoke("deploy", self.release())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual((self.root / "current").read_text().strip(), NEW)
        self.assertEqual((self.root / "config/production.env").read_text(), "MONGODB_URI=mongodb://unchanged.example:27017\n")
        commands = self.commands()
        self.assertTrue(any("pull" in c["args"] for c in commands))
        self.assertTrue(any("--no-build" in c["args"] and "--wait" in c["args"] for c in commands))
        self.assertFalse(any("build" in c["args"] or "down" in c["args"] for c in commands))
        self.assertFalse((self.root / "gateway").exists(), "API deployment must not mutate shared ingress")

    def test_bad_digest_or_tampered_file_is_rejected_before_docker(self):
        release = self.release()
        (release / "image").write_text("ghcr.io/35harry/kaizen-api:latest\n")
        self.checksums(release)
        self.assertNotEqual(self.invoke("deploy", release).returncode, 0)
        self.assertEqual(self.commands(), [])
        (release / "image").write_text(IMAGE + "c" * 64 + "\n")
        self.checksums(release)
        (release / "compose.yml").write_text("tampered")
        self.assertNotEqual(self.invoke("deploy", release).returncode, 0)
        self.assertEqual(self.commands(), [])

    def test_release_outside_root_or_symlink_is_rejected(self):
        release = self.release()
        link = self.root / "incoming-link"
        link.symlink_to(release, target_is_directory=True)
        self.assertNotEqual(self.invoke("deploy", link).returncode, 0)
        outside = Path(self.scratch.name) / "outside"
        shutil.copytree(release, outside)
        self.assertNotEqual(self.invoke("deploy", outside).returncode, 0)
        self.assertEqual(self.commands(), [])

    def test_update_and_explicit_rollback_preserve_previous_release(self):
        self.baseline()
        self.assertEqual(self.invoke("deploy", self.release()).returncode, 0)
        self.assertEqual((self.root / "previous").read_text().strip(), OLD)
        result = self.invoke("rollback")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual((self.root / "current").read_text().strip(), OLD)
        self.assertEqual((self.root / "previous").read_text().strip(), NEW)

    def test_unhealthy_candidate_automatically_restores_previous_image(self):
        self.baseline()
        result = self.invoke("deploy", self.release(digest="b"))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("restored", result.stderr)
        self.assertEqual((self.root / "current").read_text().strip(), OLD)
        ups = [c for c in self.commands() if "up" in c["args"]]
        self.assertEqual([c["image"] for c in ups], [IMAGE + "b" * 64, IMAGE + "a" * 64])

    def test_failed_authenticated_probe_also_rolls_back(self):
        self.baseline()
        result = self.invoke("deploy", self.release(), FAIL_PROBE="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.root / "current").read_text().strip(), OLD)

    def test_failed_pull_does_not_restart_running_release(self):
        self.baseline()
        result = self.invoke("deploy", self.release(), FAIL_PULL="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any("up" in c["args"] for c in self.commands()))
        self.assertEqual((self.root / "current").read_text().strip(), OLD)

    def test_first_failure_has_no_false_success_state(self):
        result = self.invoke("deploy", self.release(digest="b"))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("no previous release", result.stderr)
        self.assertFalse((self.root / "current").exists())

    def test_same_release_rerun_keeps_rollback_target(self):
        self.baseline()
        release = self.release()
        self.assertEqual(self.invoke("deploy", release).returncode, 0)
        self.assertEqual(self.invoke("deploy", release).returncode, 0)
        self.assertEqual((self.root / "previous").read_text().strip(), OLD)

    def test_concurrent_deployment_fails_before_docker(self):
        import fcntl
        release = self.release()
        with (self.root / "deploy.lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            result = self.invoke("deploy", release)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.commands(), [])


@unittest.skipUnless(os.name == "posix", "Release packaging runs in Linux CI")
class PackageTest(unittest.TestCase):
    def test_package_contains_only_runtime_files_and_exact_metadata(self):
        script = OPS / "package.sh"
        self.assertTrue(script.is_file(), "release packager is missing")
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "release"
            result = subprocess.run(["bash", str(script), IMAGE + "a" * 64, NEW, str(target)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            actual = {p.relative_to(target).as_posix() for p in target.rglob("*") if p.is_file()}
            self.assertEqual(actual, {*FILES, "checksums.sha256"})
            self.assertEqual((target / "image").read_text().strip(), IMAGE + "a" * 64)
            self.assertEqual((target / "revision").read_text().strip(), NEW)
            self.assertNotEqual(subprocess.run(["bash", str(script), IMAGE + "a" * 64, NEW, str(target)], capture_output=True).returncode, 0)

    def test_packager_rejects_tag_or_bad_revision_before_creating_output(self):
        script = OPS / "package.sh"
        self.assertTrue(script.is_file(), "release packager is missing")
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "release"
            for image, revision in [("ghcr.io/35harry/kaizen-api:latest", NEW), (IMAGE + "a" * 64, "../escape")]:
                result = subprocess.run(["bash", str(script), image, revision, str(target)], capture_output=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(target.exists())


if __name__ == "__main__":
    unittest.main()
