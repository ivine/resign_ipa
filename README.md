# Resign IPA GitHub Action

This GitHub Action is designed to resign iOS IPA files using the `zsign` tool. It allows you to re-sign an existing IPA with a new certificate, provisioning profile, and various other options.

## Inputs

### `app_path` (required)
- **Description**: Path to the IPA file to resign.
- **Example**: `/path/to/your/app.ipa`

### `output_path` (required)
- **Description**: Path to save the resigned IPA file.
- **Example**: `/path/to/output/resigned_app.ipa`

### `pkey` (optional)
- **Description**: Path to private key or P12 file.
- **Example**: `/path/to/private.key`

### `prov` (optional)
- **Description**: Comma-separated list of paths to mobile provisioning profiles.
- **Example**: `/path/to/prov1.mobileprovision,/path/to/prov2.mobileprovision`

### `cert` (optional)
- **Description**: Path to the certificate file.
- **Example**: `/path/to/certificate.pem`

### `password` (optional)
- **Description**: Password for private key or P12 file.
- **Example**: `your_password`

### `bundle_id` (optional)
- **Description**: New bundle identifier.
- **Example**: `com.new.bundle.identifier`

### `bundle_name` (optional)
- **Description**: New bundle name.
- **Example**: `NewBundleName`

### `bundle_version` (optional)
- **Description**: New bundle version.
- **Example**: `2.0.1`

### `entitlements` (optional)
- **Description**: Path to entitlements file.
- **Example**: `/path/to/entitlements.plist`

### `zip_level` (optional)
- **Description**: Compression level for the output IPA (0-9).
- **Example**: `5`

### `dylib` (optional)
- **Description**: Path to inject dylib file (repeatable).
- **Example**: `/path/to/dylib.dylib`

### `weak` (optional)
- **Description**: Inject dylib as `LC_LOAD_WEAK_DYLIB`.
- **Example**: `/path/to/weak.dylib`

### `temp_folder` (optional)
- **Description**: Path to temporary folder for intermediate files.
- **Example**: `/path/to/temp/folder`

### `sha256_only` (optional)
- **Description**: Serialize a single code directory using SHA256.
- **Example**: `true`

### `quiet` (required)
- **Description**: Quiet mode, suppress output.
- **Example**: `true`

### `force` (optional)
- **Description**: Force sign without cache when signing a folder.
- **Example**: `true`

### `adhoc` (optional)
- **Description**: Perform ad-hoc signature only.
- **Example**: `true`

### `debug` (optional)
- **Description**: Generate debug output files (`.zsign_debug` folder).
- **Example**: `true`

## Outputs

### `resigned_app`
- **Description**: The path to the resigned IPA file.
- **Example**: `/path/to/output/resigned_app.ipa`

## Usage

Here's an example workflow using this action:

```yaml
name: Resign IPA Workflow

on:
  push:
    branches:
      - main

jobs:
  resign:
    runs-on: macos-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Resign IPA
        uses: ivine/resign_ipa@v1
        with:
          zip_level: '9'
          pkey: '/path/to/private.key'
          password: 'your_password'
          prov: '/path/to/prov1.mobileprovision,/path/to/prov2.mobileprovision'
          app_path: '/path/to/your/app.ipa'
          output_path: '/path/to/output/resigned_app.ipa'
