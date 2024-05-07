const http = require('http');
const fs = require('fs');
const dossier_trans = fs.readdirSync('./public/images/trans');
const dossier_femme = fs.readdirSync('./public/images/femmes_normales');
let score = 0;
let lastSessionId = 0; //a push dans une data base
const sessions = [];

const server = http.createServer((req, res) => {

    if (req.url === '/') {
        if (!req.headers.cookie) {

            lastSessionId++;
            res.setHeader('Set-Cookie', `sessionId=${lastSessionId}`);
            sessions[lastSessionId] = { id: lastSessionId, score: 0, alreadySortedNumbersWomen: [], alreadySortedNumbersTrans: [], isTrans: 0 };
        }
        else {
            let sessionId = req.headers.cookie.split('=')[1];
            if (sessions[sessionId] == undefined) {
                lastSessionId++;
                res.setHeader('Set-Cookie', `sessionId=${lastSessionId}`);
                sessions[lastSessionId] = { id: lastSessionId, score: 0, alreadySortedNumbersWomen: [], alreadySortedNumbersTrans: [], isTrans: 0 };
            }

        }
        if (req.headers.cookie && sessions[req.headers.cookie.split('=')[1]] != undefined){
            let sessionId = req.headers.cookie.split('=')[1];
            sessions[sessionId].score = 0;
            res.end(fs.readFileSync('./public/index.html'));
        }
        else {
            res.statusCode = 302;
            res.setHeader('Location', '/');
            res.end();
        }

    }
    else if(req.url ==="/reset"){
        if(req.headers.cookie && sessions[req.headers.cookie.split('=')[1]] != undefined){
        let sessionId = req.headers.cookie.split('=')[1];
        sessions[sessionId].alreadySortedNumbersTrans = [];
        sessions[sessionId].alreadySortedNumbersWomen = [];
    }
    res.statusCode = 302;
        res.setHeader('Location', '/');
        res.end();
    }
    else if (req.url === '/game') {
        game(req, res);
    }
    else if (req.url.startsWith("/istrans")) {
        checkResponse(req, res);
    }
    else if (req.url.startsWith('/public/')) {
        serveStaticFile(req, res);
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Page Not Found!</h1>');
    }
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});


function serveStaticFile(req, res) {
    try {
        if(req.url.endsWith('.css')) {
            res.writeHead(200, { 'Content-Type': 'text/css' });
        }
        res.end(fs.readFileSync('./' + req.url));

    }
    catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Page Not Found!</h1>');
    }
}


function game(req, res) {
    let random_id;
    if (!req.headers.cookie || sessions[req.headers.cookie.split('=')[1]] == undefined) {
        res.statusCode = 302;
        res.setHeader('Location', '/');
        res.end();
        return;
    }

    let id = req.headers.cookie.split('=')[1];
    console.log(id);
    let isTrans = Math.floor(Math.random() * 2);
    sessions[id].isTrans = isTrans;
    
    if (sessions[id].alreadySortedNumbersTrans.length === dossier_trans.length || sessions[id].alreadySortedNumbersWomen.length === dossier_femme.length) {
        youwin(req, res);
        return;
    }

    if (isTrans == 1) {
        random_id = Math.floor(Math.random() * dossier_trans.length);

        while (sessions[id].alreadySortedNumbersTrans.includes(random_id)) {
            random_id = Math.floor(Math.random() * dossier_trans.length);
        }
        sessions[id].alreadySortedNumbersTrans.push(random_id);
    } else {
        random_id = Math.floor(Math.random() * dossier_femme.length);
        while (sessions[id].alreadySortedNumbersWomen.includes(random_id)) {
            random_id = Math.floor(Math.random() * dossier_femme.length);
        }
        sessions[id].alreadySortedNumbersWomen.push(random_id);
    }

    console.log(sessions[id].alreadySortedNumbersWomen);
    console.log(sessions[id].alreadySortedNumbersTrans);

    let imageUrl = isTrans == 1 ? `/public/images/trans/${dossier_trans[random_id].toString()}` : `/public/images/femmes_normales/${dossier_femme[random_id].toString()}`;
    
    let htmlResponse = `<!DOCTYPE html>
        <html>
        <head>
            <title>Game</title>
            <link rel="stylesheet" type="text/css" href="/public/style.css">
        </head>
        <body>
            <div class="container">                
                <a href ="/"><img src="/public/logo.png" class="logo_in_game"></a>
                <h2>Score: ${sessions[id].score}</h2>
                ${isTrans == 1 ? `<img src="${imageUrl}" class ="displayedImage">` : ''}
                ${isTrans == 0 ? `<img src="${imageUrl}" class ="displayedImage">` : ''}
                <div class="validButtons">
                    <a href="/istrans/0" class="button blueButton">Pas Trans</a>
                    <a href="/istrans/1" class="button pinkButton">Trans</a>
                </div>
            </div>
        </body>
        </html>`;

    res.end(htmlResponse);
}

function checkResponse(req, res) {

    if (req.headers.cookie || sessions[req.headers.cookie.split('=')[1]] != undefined) {

        let sessionId = req.headers.cookie.split('=')[1];
        let response = req.url.split('/')[2];

        console.log(sessions[sessionId].alreadySortedNumbersTrans);
        if (response == sessions[sessionId].isTrans) {
            goodResp(req, res);
        }
        else {
            badResp(req, res);
        }
    }
    else {
        res.statusCode = 302;
        res.setHeader('Location', '/');
        res.end();
    }
}

function goodResp(req, res) {
    let sessionId = req.headers.cookie.split('=')[1];
    sessions[sessionId].score++;
    res.statusCode = 302;
    res.setHeader('Location', '/game');
    res.end();
}
function badResp(req, res) {
    res.end(`<!DOCTYPE html>
        <html>
        <head>
            <title>Game Over</title>
            <link rel="stylesheet" type="text/css" href="/public/style.css">
        </head>
        <body>
            <div class="container">
                <h2>Perdu !</h2>
                <p>Tu serais pas un peu transphobe &#129300;?</p>
                <a href="/" class="button blueButton">Retente ta chance</a>
            </div>
        </body>
        </html>`);
}
function youwin(req, res) {
    res.end(`<!DOCTYPE html>
    <html>
    <head>
<meta charset="UTF-8">

        <title>Game Over</title>
        <link rel="stylesheet" type="text/css" href="/public/style.css">
    </head>
    <body>
        <div class="container">
            <h2>Gagné !&#127881</h2>
            <p> Tu es vraiment le roi des trans &#127987 </p>
            <a href="/" class="button blueButton">Retourne à l'acceuil</a>
        </div>
    </body>
    </html>`);
}