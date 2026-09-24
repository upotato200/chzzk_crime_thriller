// Chzzk is used only to verify streamer identity. No chat scopes or sockets.
export async function chzzkRequest(endpoint,{token,body}={}){
  const r=await fetch(`https://openapi.chzzk.naver.com${endpoint}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error('Chzzk authentication failed');const data=await r.json();return data.content??data;
}
