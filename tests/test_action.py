import json
from subprocess import run

def test_config_installed():
    output = run(["conan", "profile", "list", "--format", "json"], capture_output=True, text=True, check=True)
    installed_profiles = json.loads(output.stdout)
    assert "my-profile" in installed_profiles
