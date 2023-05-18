If you want to connect to the RDS database, or access the EFS filesystem, on localhost - you'll need a ClientVPN. This is because those are in a private subnet. Before you can do this step, you first need to generate a clientCertificate using the commands below. Then you'll import that clientCertificateArn to AWS, get the ARN, and assign it in your .env.shared* file. If that .env variable isn't present, then a clientVpn  will not be setup. Let's take it from the top.

Again, with `CLIENT_CERTIFICATE_ARN=` in your .env file, no ClientVPN will be setup.

## 1. Setup Client Certificate

Do the below in a git-ignored folder, like tmp/
```bash
cd tmp
```

Generate the CA files
```bash
openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -subj "/CN=My Own CA" -days 3650 -out ca.crt
```

Generate the client certificate
```bash
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365
```

Import the client certificate to AWS
```bash
aws acm import-certificate --certificate fileb://client.crt --private-key fileb://client.key --certificate-chain fileb://ca.crt
```

The output of that execution will give you the clientCertificateARN. Paste that into your .env file. Likely `.env.shared-dev` or just `.env.shared`. The shared-* concept is that one stack can be used for all dev projects (staging, local, testing, etc) to house RDS, VPC, and all the expensive stuff. And of course you'll have just one for your prod stuff, `shared-prod`.

## 2. Setup client-config.ovpn

First, deploy sst shared-(dev|prod) so that you have the ClientVpnEndpointID needed next.
```bash
pushd ..  # go up
npx sst deploy --stage=shared-dev
popd  # then come back to tmp folder
# Copy the clientVpnEndpointId from the output
```

Download the .ovpn file from AWS. Note the placeholder, coming from above 
```bash
aws ec2 export-client-vpn-client-configuration --client-vpn-endpoint-id <ClientVpnEndpointID> --output text > client-config.ovpn
```

Fix up the .ovpn file. It comes with only a `<ca />` block, of the required 3 (`<ca />`, `<cert />`, `<key />`). Open these 3 files in your editor: `./client.crt`, `./client.key`, `./client-config.ovpn`. Copy the contents of client.crt into a `<cert />` block, and client.key to `<key /`>. Probably best before / after the existing `<ca />`, but it might not matter. So in the end it will look kinda like:

```text
client
dev tun
...
verb 3
<key>
-----BEGIN PRIVATE KEY-----
blahblahblah
-----END PRIVATE KEY-----
</key>
<cert>
-----BEGIN CERTIFICATE-----
blahblahblah
-----END CERTIFICATE-----
</cert>
<ca>
-----BEGIN CERTIFICATE-----
Mine has 3 full bocks for this section
-----END CERTIFICATE-----
</ca>


reneg-sec 0

verify-x509-name staging.gnothiai.com name
```
 
## 3. Connect to OpenVPN

Finally, download the OpenVPN community client for Windows/Mac/Linux, import the .ovpn, and connect. Now you can use your RDS connection info to connect to the DB, the DNS name should resolve! You'll find your connection information in the AWS Console > AWS Secrets Manager > Secrets > RdsSecretXYZ > Retrieve Secret Value.

## Notes 

**What about Server Certificate**

ClientVPNs, being MTLS, require both a server and client certificate. As you see in [AWS > Client VPN > Mutual Authentication](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/mutual.html), they use `easyrsa` to generate both client & server certificates. (BTW, should I switch to easyrsa above? it works, so I didn't bother). However, we want the server certificate to be handled automatically so we can use CDK constructs to tie it to the host. I'm not 100% on this, but it seemed a lot cleaner when I set things up.

Incidentally if anyone has input, please reach out - this stuff is new to me. My only thing is I want as much of it in CDK as possible (rather than CLI / Console steps). 
