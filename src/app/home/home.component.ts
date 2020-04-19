import { Component, OnInit } from '@angular/core';

const log = require('electron-log');
const { google } = require('googleapis');
const { shell } = require('electron')
const http = require('http');
const fs = require('fs');
const TOKEN_PATH = 'token.json';

const clientId = "";
const clientSecret = "";
const redirectUrl = "http://localhost:3000";


const scopes = ["https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/drive.appdata",
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  "https://www.googleapis.com/auth/drive"
]



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void { }

  async create() {
    log.log("list files ...")

    let token = fs.readFileSync(TOKEN_PATH);

    log.info("token", JSON.parse(token));



    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
    oAuth2Client.setCredentials(JSON.parse(token));

    const oauth2 = google.oauth2('v2');
    let uname = await oauth2.userinfo.get({ auth: oAuth2Client })

    log.log("uname", uname)

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });


    drive.files.create({
      resource: {
        name: 'Another File 5',
        mimeType: 'text/plain',
      },
      media: {
        mimeType: 'text/plain',
        body: 'File Body',
      }
    }, function (err, result) {
      if (err) console.log(err)
      else console.log(result)
    });


  }
  async list() {
    log.log("list files ...")

    let token = fs.readFileSync(TOKEN_PATH);

    log.info("token", JSON.parse(token));



    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
    oAuth2Client.setCredentials(JSON.parse(token));

    const oauth2 = google.oauth2('v2');
    let uname = await oauth2.userinfo.get({ auth: oAuth2Client })

    log.log("uname", uname)

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const files = res.data.files;
      if (files.length) {
        console.log('Files:');
        files.map((file) => {
          console.log(`${file.name} (${file.id})`);
        });
      } else {
        console.log('No files found.');
      }
    });


  }
  login() {

    log.log("log-in-user")
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
    const url = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, approval_prompt: "force" });
    shell.openExternal(url)


    const hostname = '127.0.0.1';
    const port = 3000;
    const server = http.createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('You can close this window now.');
    });
    server.listen(port, hostname, () => {
      log.log(`Server running at http://${hostname}:${port}/`);
    });

    server.on('request', (request, response) => {
      const qs = new URL(request.url, 'http://localhost:3000').searchParams;
      const code = qs.get('code');
      if (!code) return

      oAuth2Client.getToken(code, (err, token) => {
        if (err) return log.error('Error retrieving access token', err);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return log.error(err);
          log.log('Token stored to', TOKEN_PATH);
        });
        server.close();
      });
    });
  }

}
