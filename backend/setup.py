import sys
from pathlib import Path
from setuptools import setup, find_namespace_packages

current_dir = Path(__file__).resolve().parent
all_sub = find_namespace_packages(where=str(current_dir))

packages = ["backend"] + [f"backend.{p}" for p in all_sub] + all_sub
package_dir = {"backend": "."}
for p in all_sub:
    package_dir[f"backend.{p}"] = p.replace(".", "/")

setup(
    name="backend",
    version="1.0.0",
    package_dir=package_dir,
    packages=packages,
)
