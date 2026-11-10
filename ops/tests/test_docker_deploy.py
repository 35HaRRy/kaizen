"""Opt-in Linux test: real API/Mongo/Caddy, real Bash deploy and automatic recovery.

Only registry pulls/digest references are mapped to the locally built test image.
No production env, public ACME, host ports, server data or shared networks are used.
"""
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import tempfile
import time
import unittest
import uuid

OPS = Path(__file__).resolve().parents[1]
FILES = ("compose.yml", "deploy.sh", "image", "revision", "gateway/compose.yml", "gateway/kaizen.caddy")


@unittest.skipUnless(os.name == "posix" and os.environ.get("RUN_DOCKER_DEPLOY_TESTS") == "1",
                     "opt in on Linux with Docker and a built VERIFY_API_IMAGE")
class DockerDeployTest(unittest.TestCase):
    def test_real_health_failure_recovers_previous_api_without_database_changes(self):
        real_docker = shutil.which("docker")
        self.assertIsNotNone(real_docker)
        image = os.environ.get("VERIFY_API_IMAGE", "kaizen-api:ci")
        token = secrets.token_hex(32)
        password = secrets.token_hex(24)
        suffix = uuid.uuid4().hex[:12]
        project = f"verify-deploy-{suffix}"
        proxy, database = f"{project}-proxy", f"{project}-db"
        mongo, gateway = f"{project}-mongo", f"{project}-gateway"
        created_networks, created_containers = [], []

        def docker(*args, check=True):
            result = subprocess.run([real_docker, *map(str, args)], capture_output=True, text=True, timeout=180)
            if check and result.returncode:
                self.fail((result.stderr + result.stdout).replace(token, "[secret]").replace(password, "[password]"))
            return result

        def wait_for(command):
            deadline = time.monotonic() + 45
            while time.monotonic() < deadline:
                result = command()
                if result.returncode == 0:
                    return
                time.sleep(0.25)
            self.fail("Disposable dependency did not become ready")

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "install"
            (root / "config").mkdir(parents=True)
            envfile = root / "config/production.env"
            envfile.write_text(f"MONGODB_URI=mongodb://test:{password}@{mongo}:27017/kaizen_test?authSource=admin\n"
                               f"MONGODB_DB=kaizen_test\nAPP_ORIGIN=https://web.verify.test\nORIGIN_SECRET={token}\n")
            safe_env = envfile.read_bytes()
            probe_config = Path(tmp) / "Caddyfile"
            probe_config.write_text("{\n local_certs\n}\ndeploy.verify.test {\n reverse_proxy kaizen-api:3001\n}\n")
            ca = Path(tmp) / "root.crt"
            bad = Path(tmp) / "bad.json"
            bad.write_text(json.dumps({"services": {"api": {"command": ["node", "-e", "process.exit(1)"]}}}))
            compose_commands = []
            try:
                docker("image", "inspect", image)
                for name in (proxy, database):
                    docker("network", "create", "--internal", name)
                    created_networks.append(name)
                docker("run", "-d", "--name", mongo, "--network", database,
                       "--tmpfs", "/data/db", "--tmpfs", "/data/configdb",
                       "-e", "MONGO_INITDB_ROOT_USERNAME=test", "-e", f"MONGO_INITDB_ROOT_PASSWORD={password}", "mongo:8.0")
                created_containers.append(mongo)
                wait_for(lambda: docker("exec", mongo, "mongosh", "--quiet", "-u", "test", "-p", password,
                                        "--authenticationDatabase", "admin", "--eval", "db.adminCommand({ping:1})", check=False))
                docker("create", "--name", gateway, "--network", proxy, "--network-alias", "deploy.verify.test",
                       "caddy:2.11.4-alpine", "caddy", "run", "--config", "/etc/caddy/probe.Caddyfile")
                created_containers.append(gateway)
                docker("cp", probe_config, f"{gateway}:/etc/caddy/probe.Caddyfile")
                docker("start", gateway)
                wait_for(lambda: docker("cp", f"{gateway}:/data/caddy/pki/authorities/local/root.crt", ca, check=False))
                ca.chmod(0o644)  # Test CA is public; the non-root API must be able to read it.

                # Render the real runtime config, then isolate only network names for this run.
                runtime_keys = {"MONGODB_URI", "MONGODB_DB", "APP_ORIGIN", "ORIGIN_SECRET", "TURNSTILE_SECRET_KEY",
                                "R2_ENDPOINT", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_ORIGIN"}
                render_env = {key: value for key, value in os.environ.items() if key not in runtime_keys}
                rendered = json.loads(subprocess.run(
                    [real_docker, "compose", "--env-file", str(envfile), "-f", str(OPS / "compose.yml"), "config", "--format", "json"],
                    env={**render_env, "KAIZEN_API_IMAGE": image}, capture_output=True, text=True, check=True).stdout)
                rendered["networks"]["proxy"]["name"] = proxy
                rendered["networks"]["database"] = {"external": True, "name": database}
                rendered["services"]["api"]["networks"]["database"] = None
                rendered["services"]["api"]["healthcheck"].update(interval="1s", start_period="1s", retries=5)
                rendered["services"]["api"]["restart"] = "no"

                bin_dir = Path(tmp) / "bin"
                bin_dir.mkdir()
                wrapper = bin_dir / "docker"
                wrapper.write_text('''#!/usr/bin/env python3
import json, os, subprocess, sys
args=sys.argv[1:]
env=dict(os.environ)
digest=env.get('KAIZEN_API_IMAGE','')
env['KAIZEN_API_IMAGE']=os.environ['VERIFY_API_IMAGE']
real=os.environ['REAL_DOCKER']
if args[0]=='pull':
    sys.exit(subprocess.run([real,'image','inspect',env['KAIZEN_API_IMAGE']],stdout=subprocess.DEVNULL).returncode)
if args[0]=='compose':
    args[args.index('-p')+1]=os.environ['VERIFY_PROJECT']
    if digest.endswith('b'*64):
        index=args.index('-f')+2
        args[index:index]=['-f',os.environ['VERIFY_BAD_CONFIG']]
    if 'exec' in args:
        prefix=args[:args.index('exec')]
        cid=subprocess.check_output([real,*prefix,'ps','-q','api'],env=env,text=True).strip()
        subprocess.run([real,'cp',os.environ['VERIFY_CA'],cid+':/tmp/verify-ca.crt'],check=True,stdout=subprocess.DEVNULL)
        index=args.index('api',args.index('exec'))
        args[index:index]=['-e','NODE_EXTRA_CA_CERTS=/tmp/verify-ca.crt']
result=subprocess.run([real,*args],env=env,capture_output=True,text=True)
with open(os.environ['VERIFY_TRACE'],'a') as trace:
    trace.write(json.dumps(args)+'\\n'+result.stdout+result.stderr+'\\n')
sys.stdout.write(result.stdout)
sys.stderr.write(result.stderr)
sys.exit(result.returncode)
''')
                wrapper.chmod(0o755)
                env = {**os.environ, "PATH": f"{bin_dir}:{os.environ['PATH']}", "REAL_DOCKER": real_docker,
                       "VERIFY_API_IMAGE": image, "VERIFY_PROJECT": project, "VERIFY_BAD_CONFIG": str(bad), "VERIFY_CA": str(ca),
                       "VERIFY_TRACE": str(Path(tmp) / "trace")}

                def deploy(revision, digest):
                    incoming = root / f"incoming-{revision}"
                    (incoming / "gateway").mkdir(parents=True)
                    shutil.copyfile(OPS / "deploy.sh", incoming / "deploy.sh")
                    for name in ("gateway/compose.yml", "gateway/kaizen.caddy"):
                        shutil.copyfile(OPS / name, incoming / name)
                    config = json.loads(json.dumps(rendered))
                    config["services"]["api"]["image"] = "${KAIZEN_API_IMAGE}"
                    (incoming / "compose.yml").write_text(json.dumps(config))
                    (incoming / "image").write_text("ghcr.io/35harry/kaizen-api@sha256:" + digest * 64 + "\n")
                    (incoming / "revision").write_text(revision + "\n")
                    (incoming / "checksums.sha256").write_text("".join(
                        f"{hashlib.sha256((incoming / name).read_bytes()).hexdigest()}  {name}\n" for name in FILES))
                    compose_commands.append([real_docker, "compose", "--env-file", str(envfile), "-p", project,
                                             "-f", str(incoming / "compose.yml")])
                    return subprocess.run(["bash", str(OPS / "deploy.sh"), "deploy", str(root), str(incoming), "https://deploy.verify.test"],
                                          env=env, capture_output=True, text=True, timeout=180)

                good = deploy("1" * 40, "a")
                trace = Path(env["VERIFY_TRACE"])
                details = trace.read_text() if trace.exists() else ""
                self.assertEqual(good.returncode, 0, (good.stdout + good.stderr + details[-8000:]).replace(token, "[secret]").replace(password, "[password]"))
                failed = deploy("2" * 40, "b")
                self.assertNotEqual(failed.returncode, 0)
                self.assertIn("previous release restored", failed.stderr)
                self.assertEqual((root / "current").read_text().strip(), "1" * 40)
                self.assertEqual(envfile.read_bytes(), safe_env)
                recovered = deploy("3" * 40, "c")
                self.assertEqual(recovered.returncode, 0, recovered.stdout + recovered.stderr)
                rollback = subprocess.run(["bash", str(OPS / "deploy.sh"), "rollback", str(root), "https://deploy.verify.test"],
                                          env=env, capture_output=True, text=True, timeout=180)
                self.assertEqual(rollback.returncode, 0, rollback.stdout + rollback.stderr)
                self.assertEqual((root / "current").read_text().strip(), "1" * 40)
            finally:
                if compose_commands:
                    subprocess.run(compose_commands[-1] + ["down", "--timeout", "10"],
                                   env={**os.environ, "KAIZEN_API_IMAGE": image}, capture_output=True, timeout=90)
                for name in reversed(created_containers):
                    docker("rm", "-f", "-v", name, check=False)
                for name in reversed(created_networks):
                    docker("network", "rm", name, check=False)


if __name__ == "__main__":
    unittest.main()
