const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

// Configurações
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));

app.use(session({
  secret: 'chave-secreta-super-segura',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
}));

// Armazenamento em memória
const produtos = [];

// Middleware para atualizar último acesso
app.use((req, res, next) => {
  if (req.session.usuario) {
    const agora = new Date().toLocaleString('pt-BR');
    res.cookie('ultimoAcesso', agora, { maxAge: 30 * 60 * 1000 });
  }
  next();
});

// Rota: Página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Processar login
app.post('/login', (req, res) => {
  const { usuario } = req.body;
  if (usuario && usuario.trim() !== '') {
    req.session.usuario = usuario.trim();
    res.redirect('/cadastro');
  } else {
    res.send('<h2>Usuário inválido!</h2><a href="/">Voltar</a>');
  }
});

// Rota protegida: cadastro de produtos
app.get('/cadastro', (req, res) => {
  if (!req.session.usuario) {
    return res.send(`
      <h2>Você precisa fazer login para acessar esta página!</h2>
      <a href="/">Fazer Login</a>
    `);
  }

  res.sendFile(path.join(__dirname, 'views', 'cadastro.html'));
});

// Processar cadastro de produto
app.post('/cadastro', (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/');
  }

  const { codigoBarras, descricao, precoCusto, precoVenda, validade, estoque, fabricante } = req.body;

  const produto = {
    codigoBarras,
    descricao,
    precoCusto: parseFloat(precoCusto),
    precoVenda: parseFloat(precoVenda),
    validade,
    estoque: parseInt(estoque),
    fabricante
  };

  produtos.push(produto);

  // Renderizar página com tabela atualizada
  const ultimoAcesso = req.cookies.ultimoAcesso || 'Primeiro acesso';

  let tabela = `
    <h2>Bem-vindo, ${req.session.usuario}!</h2>
    <p><strong>Último acesso:</strong> ${ultimoAcesso}</p>
    <h3>Produto cadastrado com sucesso!</h3>
    <h3>Produtos Cadastrados (${produtos.length})</h3>
    <table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th>Cód. Barras</th>
          <th>Descrição</th>
          <th>Preço Custo</th>
          <th>Preço Venda</th>
          <th>Validade</th>
          <th>Estoque</th>
          <th>Fabricante</th>
        </tr>
      </thead>
      <tbody>
  `;

  produtos.forEach(p => {
    tabela += `
      <tr>
        <td>${p.codigoBarras}</td>
        <td>${p.descricao}</td>
        <td>R$ ${p.precoCusto.toFixed(2)}</td>
        <td>R$ ${p.precoVenda.toFixed(2)}</td>
        <td>${p.validade}</td>
        <td>${p.estoque}</td>
        <td>${p.fabricante}</td>
      </tr>
    `;
  });

  tabela += `
      </tbody>
    </table>
    <br>
    <a href="/cadastro">Cadastrar outro produto</a> | 
    <a href="/logout">Sair</a>
  `;

  res.send(tabela);
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});