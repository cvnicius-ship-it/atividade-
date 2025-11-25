const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: "chave-secreta-123",
    resave: false,
    saveUninitialized: false
}));

let products = [];

// Página de login
app.get("/", (req, res) => {
    res.send(`
        <h1>Login do Sistema</h1>
        <form action="/login" method="post">
            <p><input type="text" name="username" placeholder="Usuário" required></p>
            <p><input type="password" name="password" placeholder="Senha" required></p>
            <button type="submit">Entrar</button>
        </form>
    `);
});

// Processa login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "admin") {
        const agora = new Date().toLocaleString('pt-BR');
        const ultimo = req.cookies.ultimo_acesso || "Primeira vez";
        
        req.session.user = username;
        req.session.ultimoAcesso = ultimo;
        
        res.cookie("ultimo_acesso", agora, { maxAge: 90000000 });
        res.redirect("/products");
    } else {
        res.send("Usuário ou senha inválidos! <a href='/'>Tentar novamente</a>");
    }
});

// Página principal com cadastro e lista
app.get("/products", (req, res) => {
    if (!req.session.user) {
        return res.send("Você precisa fazer login! <a href='/'>Ir para login</a>");
    }

    const ultimo = req.session.ultimoAcesso || "Primeira vez";

    let tabela = `<table border="1" style="width:100%; margin-top:20px;">
        <tr style="background:#ddd;">
            <th>Código de Barras</th><th>Descrição</th><th>Preço Custo</th><th>Preço Venda</th>
            <th>Validade</th><th>Estoque</th><th>Fabricante</th>
        </tr>`;

    products.forEach(p => {
        tabela += `<tr>
            <td>${p.barcode}</td>
            <td>${p.description}</td>
            <td>R$ ${p.costPrice}</td>
            <td>R$ ${p.sellingPrice}</td>
            <td>${p.expirationDate}</td>
            <td>${p.stockQuantity}</td>
            <td>${p.manufacturer}</td>
        </tr>`;
    });
    tabela += "</table>";

    res.send(`
        <h1>Bem-vindo, ${req.session.user}!</h1>
        <p><strong>Último acesso:</strong> ${ultimo}</p>
        <hr>
        <h2>Cadastrar Novo Produto</h2>
        <form action="/products" method="post">
            <input type="text" name="barcode" placeholder="Código de barras" required><br><br>
            <input type="text" name="description" placeholder="Descrição" required><br><br>
            <input type="number" step="0.01" name="costPrice" placeholder="Preço de custo" required><br><br>
            <input type="number" step="0.01" name="sellingPrice" placeholder="Preço de venda" required><br><br>
            <input type="date" name="expirationDate" required><br><br>
            <input type="number" name="stockQuantity" placeholder="Quantidade em estoque" required><br><br>
            <input type="text" name="manufacturer" placeholder="Fabricante" required><br><br>
            <button type="submit" style="padding:10px 20px; font-size:16px;">CADASTRAR PRODUTO</button>
        </form>
        <h2>Produtos Cadastrados (${products.length})</h2>
        ${products.length === 0 ? "<p>Nenhum produto cadastrado ainda.</p>" : tabela}
        <br><br>
        <a href="/">Sair (logout)</a>
    `);
});

// Recebe cadastro de produto
app.post("/products", (req, res) => {
    if (!req.session.user) return res.redirect("/");
    
    const { barcode, description, costPrice, sellingPrice, expirationDate, stockQuantity, manufacturer } = req.body;
    products.push({ barcode, description, costPrice, sellingPrice, expirationDate, stockQuantity, manufacturer });
    res.redirect("/products");
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse: http://localhost:${port}`);
});
