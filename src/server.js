const express = require('express');
const app = express();
const models = require('./models/post')
const bodyParser = require('body-parser')
const promBundle = require("express-prom-bundle");
const config = require('./system-life');
const middlewares = require('./middleware')
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    promClient: {
        collectDefaultMetrics: {
        }
    }
});

app.use(fileUpload());
app.use(middlewares.countRequests)
app.use(metricsMiddleware)
app.use(config.middlewares.healthMid);
app.use('/', config.routers);
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'ejs');


app.get('/post', (req, res) => {
    res.render('edit-news', { post: { title: "", content: "", summary: "" }, valido: true });
});

app.post('/post', async (req, res) => {

    let valid = true;

    if ((req.body.title.length !== 0 && req.body.title.length < 30) &&
        (req.body.resumo.length !== 0 && req.body.resumo.length < 50) &&
        (req.body.description.length !== 0 && req.body.description.length < 2000)) {
        valid = true;
    } else {
        valid = false;
    }

    if (valid) {

        let sampleFile;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        sampleFile = req.files.sampleFile;
        fileName = uuidv4() + "." + sampleFile.name.split('.').pop()
        imageDir = __dirname + '/image_public/';
        uploadPath = imageDir + fileName;

        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir);
        }

        // Use the mv() method to place the file somewhere on your server
        sampleFile.mv(uploadPath, async function (err) {
            if (err)
                return res.status(500).send(err);

            await models.Post.create({
                title: req.body.title,
                content: req.body.description,
                summary: req.body.resumo,
                image: fileName,
                publishDate: Date.now()
            });
            res.redirect('/');
        });


    } else {
        res.render('edit-news', { post: { title: req.body.title, content: req.body.description, summary: req.body.resumo }, valido: false });
    }

});

app.post('/api/post', async (req, res) => {

    console.log(req.body.artigos)
    for (const item of req.body.artigos) {

        await models.Post.create({ title: item.title, content: item.description, summary: item.resumo, publishDate: Date.now() });
    }

    // models.Post.create({title: req.body.title, content: req.body.description, summary: req.body.resumo, publishDate: Date.now()});
    res.json(req.body.artigos)
});

app.get('/post/:id', async (req, res) => {

    const post = await models.Post.findByPk(req.params.id);
    res.render('view-news', { post: post });
});

app.get('/image/:imagem', function (req, res) {

    const imagem = req.params.imagem
    uploadPath = __dirname + '/image_public/' + imagem;
    res.sendFile(uploadPath);
})

app.get('/', async (req, res) => {

    const posts = await models.Post.findAll();
    res.render('index', { posts: posts });
});

models.initDatabase();
app.listen(8080);

console.log('Aplicação rodando na porta 8080');