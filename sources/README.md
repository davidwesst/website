# Source Repositories

This directory contains upstream source sites that feed the new combined website.

## Included sources

- `sources/digital-zuihitsu` (david.wes.st)
- `sources/davidwesst.github.io` (davidwesst.com)

## Command Reference

Clone with submodules:

```powershell
git clone --recurse-submodules https://github.com/davidwesst/website.git
```

Initialize submodules in an existing clone:

```powershell
git submodule update --init --recursive
```

Pull the latest upstream changes for both sources:

```powershell
git submodule update --remote --merge
```
