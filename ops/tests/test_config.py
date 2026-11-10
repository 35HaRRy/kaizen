"""Validate API networking and gateway adapter with the real Compose renderer."""
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class ApiConfigTest(unittest.TestCase):
    def test_api_has_no_public_port_and_requires_explicit_database(self):
        compose = ROOT / "ops/compose.yml"
        self.assertTrue(compose.is_file(), "API Compose file is missing")
        env = {**os.environ, "MONGODB_URI": "mongodb://host.docker.internal:27017",
               "MONGODB_DB": "kaizen", "APP_ORIGIN": "https://web.example.test",
               "ORIGIN_SECRET": "a" * 64,
               "KAIZEN_API_IMAGE": "ghcr.io/35harry/kaizen-api@sha256:" + "a" * 64}
        scratch = tempfile.TemporaryDirectory()
        self.addCleanup(scratch.cleanup)
        empty_env = Path(scratch.name) / "empty.env"
        empty_env.write_text("")
        command = ["docker", "compose", "--env-file", str(empty_env), "-f", str(compose), "config", "--format", "json"]
        config = json.loads(subprocess.run(command, env=env, capture_output=True, text=True, check=True).stdout)
        self.assertEqual(set(config["services"]), {"api"})
        api = config["services"]["api"]
        self.assertFalse(api.get("ports"))
        self.assertNotIn("build", api)
        self.assertEqual(api["image"], "ghcr.io/35harry/kaizen-api@sha256:" + "a" * 64)
        self.assertEqual(api["environment"]["HOST"], "0.0.0.0")
        self.assertEqual(api["environment"]["NODE_ENV"], "production")
        self.assertEqual(api["environment"]["MONGODB_URI"], "mongodb://host.docker.internal:27017")
        self.assertEqual(config["networks"]["proxy"]["name"], "gateway-kaizen")
        self.assertTrue(config["networks"]["proxy"]["external"])
        env.pop("MONGODB_URI")
        missing = subprocess.run(command, env=env, capture_output=True, text=True)
        self.assertNotEqual(missing.returncode, 0)
        self.assertIn("MONGODB_URI", missing.stderr)


if __name__ == "__main__":
    unittest.main()
