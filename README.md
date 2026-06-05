# イコラブ性格タイプ診断

静的HTML/CSS/JavaScriptで作った非公式ファン診断サイトです。

## 開き方

`index.html` をブラウザで開くか、ローカルサーバーでこのフォルダを配信してください。

```powershell
python -m http.server 5174 --bind 127.0.0.1 --directory .\outputs\equal-love-diagnosis
```

## 写真の入れ方

公式画像や公式ロゴは入れていません。許可を得た画像や自作画像を使う場合は、以下のファイル名で `assets/members/` に配置すると結果画面とトップの丸アイコンに表示されます。

- `otani-emiri.jpg`
- `oba-hana.jpg`
- `otoshima-risa.jpg`
- `saito-kiara.jpg`
- `sasaki-maika.jpg`
- `takamatsu-hitomi.jpg`
- `takiwaki-shoko.jpg`
- `noguchi-iori.jpg`
- `morohashi-sana.jpg`
- `yamamoto-anna.jpg`

外部URLを使う場合は `src/app.js` の `memberPhotos` にメンバー名ごとのURLを設定してください。
