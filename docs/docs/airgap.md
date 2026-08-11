# Airgap support and deployment

:::tip
This page is relevant only to official NC Appliances and does not cover NC built from sources.
:::

We are considering two types of air-gapped deployments:

- Physical air gap (completely offline)
- Logical air gap with limited connectivity, or physical air gap with a connected pre-production/QA environment available

## Logical Air Gap

In this scenario, you will need a QA/pre-production NCE pool with Internet access. This pool will serve as a temporary zone for registering and upgrading the NCA, before physically exporting it to the disconnected environment.

### Deployment

[Follow the standard procedure](installation) to deploy the NCA on your pool with Internet access.

Make sure that your appliance is [properly registered](installation#registration) and [up-to-date](updater).

It's also good to take a quick look at [the NCA check](xoa#nca-check) to detect issues early.

When everything is good, you can shutdown your NCA and export it:

```console
$ xe vm-shutdown uuid=$uuid
$ xe vm-export compress=true uuid=$uuid filename=xoa.xva
Export succeeded
```

> `$uuid` should be replaced by the UUID of your NCA.

Now you need to move the `xoa.xva` file from your connected pool to your airgapped one.

And the last step is to import it in your airgapped pool and start it:

```console
$ xe vm-import filename=xoa.xva
c87a6dc3-9889-acf0-a680-79de3780c08f
$ xe vm-start uuid=c87a6dc3-9889-acf0-a680-79de3780c08f
```

You can now delete the NCA on your connected pool, it is no longer necessary.

### Upgrade

To upgrade your NCA, you need to:

1. shutdown the NCA on your airgapped pool
2. export it to an XVA file
3. move it to your connected pool and import it
4. start it, run the [upgrade process](updater)
5. shutdown this NCA
6. export it to an XVA file
7. move it to your airgapped pool and import it
8. start it and check that everything appears correct
9. delete the NCA on your connected pool and the previous NCA on your airgapped pool

For details on the steps, refer to the [_Deployment_ section](#deployment).

## Physical air gap only

In this scenario, you are deploying directly without any prior Internet access. Vates can provide you with pre-registered XOAs that can be deployed directly in your offline environment, eliminating the need for any initial Internet connection. If you have an air gap subscription, our team will build it on-demand for you and provide a dedicated link for download.

Please [contact us](https://vates.tech/contact) if you need more details.

### Deploy Your Air-Gap NCA

After downloading the dedicated air-gap NCA provided by our support team, follow these steps to deploy it:

1. **Obtain the Deployment Script**: On a machine with internet access (or any non-air-gap machine), run the following command to download the deployment script:

   ```bash
   wget --no-verbose -O deploy.sh https://xoa.io/deploy
   ```

   Alternatively, you can manually copy the content from https://xoa.io/deploy into a file named `deploy.sh`.

2. **Transfer Files to Your NCE Host**: Copy both the `deploy.sh` script and the NCA appliance file (`NCA.xva`) to your air-gapped NCE host.

3. **Make the Script Executable**: On your NCE host, ensure the `deploy.sh` script is executable by running:

   ```bash
   chmod +x deploy.sh
   ```

   Then, execute the following command to deploy the NCA appliance:

   ```bash
   ./deploy.sh NCA.xva
   ```

4. **Follow the Script Instructions**: During the deployment, the script will prompt you for essential network settings such as IP configuration, DNS, and NTP. Follow the on-screen instructions to complete the setup.
