// Vercel Serverless Function
// This code acts as our smart and fast DNS resolver.

// The main function that Vercel will run
export default async function handler(request, response) {
  // 1. Get the domain name the user wants to visit from the URL
  // Example: ?domain=google.com
  const { searchParams } = new URL(request.url, `https://
  ${request.headers.host}`);
  const domain = searchParams.get('domain');

  // 2. If the user didn't provide a domain, send an error message
  if (!domain) {
    return response.status(400).json({ error: 'Please provide a domain. Usage: /api/dns?domain=google.com' });
  }

  try {
    // 3. Use Cloudflare's super-fast DNS to look up the IP address
    const dnsResponse = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}`, {
      headers: {
        'accept': 'application/dns-json',
      },
    });

    const dnsData = await dnsResponse.json();
    
    // 4. Extract the IP address from the response
    // We look for 'A' records, which are standard IP addresses
    const ipAddress = dnsData.Answer?.find(ans => ans.type === 1)?.data;

    if (!ipAddress) {
      return response.status(404).json({ error: 'Domain not found or no IP address available.' });
    }

    // 5. Success! Send the IP address back to the user
    return response.status(200).json({
      domain: domain,
      ipAddress: ipAddress,
      lookupTime: `${Date.now() - request.startTime}ms` // Calculate how fast we were
    });

  } catch (error) {
    // If something goes wrong, send a server error message
    return response.status(500).json({ error: 'Failed to resolve DNS.', details: error.message });
  }
}
