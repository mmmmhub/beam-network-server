// Vercel Serverless Function - v1.1 (Fixed)
// This code acts as our smart and fast DNS resolver.

export default async function handler(request, response) {
  const startTime = Date.now();

  // 1. Get the domain name from the URL query parameters.
  // We construct the full URL to safely parse it.
  const fullURL = new URL(request.url, `http://${request.headers.host}`);
  const domain = fullURL.searchParams.get('domain');

  // 2. If no domain is provided, return a clear error.
  if (!domain) {
    return response.status(400).json({ 
      error: 'Please provide a domain.', 
      usage: '/api/dns?domain=google.com' 
    });
  }

  try {
    // 3. Use Cloudflare's super-fast DNS-over-HTTPS service.
    const dnsApiUrl = `https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}`;
    const dnsResponse = await fetch(dnsApiUrl, {
      headers: {
        'accept': 'application/dns-json',
      },
    });

    if (!dnsResponse.ok) {
      return response.status(dnsResponse.status).json({ error: `Cloudflare DNS query failed with status: ${dnsResponse.status}` });
    }

    const dnsData = await dnsResponse.json();
    
    // 4. Find the IPv4 address (A record, type 1) in the answer.
    const ipAddress = dnsData.Answer?.find(ans => ans.type === 1)?.data;

    if (!ipAddress) {
      return response.status(404).json({ 
        error: 'Domain not found or has no A record.',
        domain: domain
      });
    }

    const lookupTime = Date.now() - startTime;

    // 5. Success! Return the result.
    return response.status(200).json({
      domain: domain,
      ipAddress: ipAddress,
      lookupTime: `${lookupTime}ms`
    });

  } catch (error) {
    console.error(error); // Log the error for debugging on Vercel
    return response.status(500).json({ 
      error: 'An internal server error occurred.', 
      details: error.message 
    });
  }
}
