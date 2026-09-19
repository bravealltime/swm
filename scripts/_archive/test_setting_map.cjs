async function testSettingMap() {
  const res = await fetch('https://m.swranking.com/api/setting/settingMap', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://m.swranking.com/'
    }
  });
  const json = await res.json();
  console.log('settingMap:', JSON.stringify(json, null, 2));
}
testSettingMap();
