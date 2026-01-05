export const handler = async (event) => {
  try {
    const { endpoint, league, type } = event.queryStringParameters || {};

    if (!endpoint || !league || !type) {
      return {
        statusCode: 400,
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ error: "Missing endpoint/league/type" }),
      };
    }

    const url = `https://poe.ninja/api/data/${endpoint}?league=${encodeURIComponent(
      league
    )}&type=${encodeURIComponent(type)}`;

    const res = await fetch(url, {
      headers: { "user-agent": "theme2025-nengu" },
    });

    const body = await res.text();

    return {
      statusCode: res.status,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
      body,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
