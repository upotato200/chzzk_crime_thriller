import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../profiler/server/db.js';
import {createApp,configuration} from '../profiler/server/index.js';

test('SEO endpoints expose canonical metadata, crawler rules and all scene images',async t=>{
  const db=await openDatabase({url:'',filename:':memory:'}),config=configuration({PUBLIC_URL:'http://localhost:3000',ALLOW_DEV_LOGIN:'true',MOCK_AI:'true',GOOGLE_SITE_VERIFICATION:'google-test-token'}),runtime=await createApp({db,config}),server=runtime.app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await runtime.close()});
  const base=`http://127.0.0.1:${server.address().port}`;
  const page=await fetch(base+'/'),html=await page.text();
  assert.equal(page.status,200);assert.match(html,/<link rel="canonical" href="http:\/\/localhost:3000\/">/);assert.match(html,/google-site-verification/);assert.match(html,/"@type":"WebApplication"/);assert.match(page.headers.get('content-security-policy'),/sha256-/);assert.doesNotMatch(html,/__PUBLIC_URL__|__SEO_JSON_LD__/);
  const robots=await (await fetch(base+'/robots.txt')).text();assert.match(robots,/Allow: \//);assert.match(robots,/Disallow: \/api\//);assert.match(robots,/Sitemap: http:\/\/localhost:3000\/sitemap.xml/);
  const sitemapResponse=await fetch(base+'/sitemap.xml'),sitemap=await sitemapResponse.text();assert.match(sitemapResponse.headers.get('content-type'),/xml/);assert.equal((sitemap.match(/<image:image>/g)||[]).length,10);assert.match(sitemap,/<loc>http:\/\/localhost:3000\/<\/loc>/);
});
