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
- **Description**: Private key content (Base64-encoded or plain string). Only used if not using P12.
- **Example**: `${{ secrets.PKEY_CONTENT }}`

### `prov` (optional)
- **Description**: Comma-separated content (not path) of mobile provisioning profiles (Base64-encoded).
- **Example**: `${{ secrets.PROV1_BASE64 }},${{ secrets.PROV2_BASE64 }}`

### `cert` (optional)
- **Description**: Certificate content (PEM format, optional if using P12).
- **Example**: `${{ secrets.CERT_CONTENT }}`

### `p12_base64` (optional)
- **Description**: Base64-encoded P12 certificate content.
- **Example**: `${{ secrets.P12_CERTIFICATE_BASE64 }}`

### `p12_password` (optional)
- **Description**: Password for P12 file.
- **Example**: `${{ secrets.P12_PASSWORD }}`

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

### `quiet` (optional)
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

**macOS Tips**:

To convert a certificate or provisioning profile to Base64:

```bash
base64 -i path/to/file.mobileprovision | pbcopy
```

### Example Workflow

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

      - name: Re-sign IPA
        uses: ivine/resign_ipa@v1
        with:
          app_path: './Payload/MyApp.ipa'
          output_path: './dist/MyApp-resigned.ipa'
          zip_level: '9'
          prov: ${{ secrets.PROV_PROFILES }}
          p12_base64: ${{ secrets.P12_CERTIFICATE_BASE64 }}
          p12_password: ${{ secrets.P12_PASSWORD }}
          force: true
```

### Example with Multiple Provisioning Profiles

```yaml
name: Resign IPA with Multiple Provisioning Profiles

on:
  push:
    branches:
      - main

jobs:
  resign:
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Re-sign IPA with multiple profiles
        uses: ivine/resign_ipa@v1
        with:
          app_path: './Payload/MyApp.ipa'
          output_path: './dist/MyApp-resigned.ipa'
          prov: ${{ secrets.PROV1_BASE64 }},${{ secrets.PROV2_BASE64 }}
          p12_base64: ${{ secrets.P12_CERTIFICATE_BASE64 }}
          p12_password: ${{ secrets.P12_PASSWORD }}
          quiet: true
          debug: true
```

## Notes

- If you're using `.p12` certificate, only `p12_base64` and `p12_password` are required.
- If you're using separate `.pem` and `.key` files, use `cert`, `pkey`, and `password`.
- Provisioning profiles must be provided as Base64-encoded strings.
- All secrets should be stored securely in GitHub Secrets.

