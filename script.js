/*
ESTADOS DA TELA

1. Carregando: o cardápio e as promoções estão sendo buscados
2. Cardápio na tela: os produtos foram carregados e aparecem nos cards
3. Erro: ocorreu um problema ao carregar os arquivos
4. Pedido vazio: nenhum produto foi adicionado
5. Enviando pedido: o pedido está sendo processado
6. Pedido confirmado: o pedido foi enviado com sucesso
7. Falha no pedido: ocorreu um erro durante o envio
*/

// 1. BUSCA

async function buscarDados(url) {
  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error("Não foi possível carregar " + url);
  }

  return resposta.json();
}

// 2. DADOS

let cardapio = [];
let pedido = [];

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function aplicarPromocoes(itens, promocoes) {
  return itens.map(function (item) {
    const promocao = promocoes.find(function (p) {
      return p.id === item.id;
    });

    if (promocao) {
      return {
        ...item,
        desconto: promocao.desconto,
        precoFinal: item.preco * (1 - promocao.desconto / 100)
      };
    }

    return {
      ...item,
      desconto: 0,
      precoFinal: item.preco
    };
  });
}

function filtrarPorCategoria(categoria) {
  if (categoria === "todas") {
    return cardapio;
  }

  return cardapio.filter(function (item) {
    return item.categoria === categoria;
  });
}

// 3. TELA

const elementoCardapio = document.getElementById("cardapio");
const elementoAviso = document.getElementById("aviso");
const elementoFiltro = document.getElementById("filtro");
const elementoPedido = document.getElementById("lista-pedido");
const elementoTotal = document.getElementById("total");
const botaoFinalizar = document.getElementById("finalizar");
const elementoStatus = document.getElementById("status-pedido");

function criarCard(item) {
  const card = document.createElement("article");
  card.classList.add("card");

  if (!item.disponivel) {
    card.classList.add("card--esgotado");
  }

  const nome = document.createElement("h3");
  nome.textContent = item.nome;

  const descricao = document.createElement("p");
  descricao.classList.add("card__descricao");
  descricao.textContent = item.descricao;

  card.appendChild(nome);
  card.appendChild(descricao);

  if (item.desconto > 0) {
    const selo = document.createElement("span");
    selo.classList.add("card__promocao");
    selo.textContent = item.desconto + "% de desconto";
    card.appendChild(selo);
  }

  const preco = document.createElement("p");
  preco.classList.add("card__preco");

  if (item.desconto > 0) {
    const precoAntigo = document.createElement("s");
    precoAntigo.classList.add("card__preco-antigo");
    precoAntigo.textContent = formatarMoeda(item.preco);
    preco.appendChild(precoAntigo);
  }

  preco.appendChild(
    document.createTextNode(formatarMoeda(item.precoFinal))
  );

  card.appendChild(preco);

  const botao = document.createElement("button");
  botao.classList.add("card__botao");

  if (item.disponivel) {
    botao.textContent = "Adicionar";

    botao.addEventListener("click", function () {
      adicionarAoPedido(item.id);
    });
  } else {
    botao.textContent = "Esgotado";
    botao.disabled = true;
  }

  card.appendChild(botao);

  return card;
}

function mostrarCardapio(itens) {
  elementoCardapio.replaceChildren();

  itens.forEach(function (item) {
    elementoCardapio.appendChild(criarCard(item));
  });
}

function mostrarPedido() {
  elementoPedido.replaceChildren();

  let total = 0;

  pedido.forEach(function (item) {
    const linha = document.createElement("li");
    linha.classList.add("pedido__item");

    const informacoes = document.createElement("span");

    informacoes.textContent =
      item.nome + " x " + item.quantidade +
      " — " + formatarMoeda(item.precoFinal * item.quantidade);

    const botaoRemover = document.createElement("button");
    botaoRemover.classList.add("pedido__remover");
    botaoRemover.textContent = "Remover";

    botaoRemover.addEventListener("click", function () {
      removerDoPedido(item.id);
    });

    linha.appendChild(informacoes);
    linha.appendChild(botaoRemover);
    elementoPedido.appendChild(linha);

    total += item.precoFinal * item.quantidade;
  });

  elementoTotal.textContent = formatarMoeda(total);
}

function adicionarAoPedido(id) {
  const item = cardapio.find(function (produto) {
    return produto.id === id;
  });

  if (!item || !item.disponivel) {
    return;
  }

  const itemExistente = pedido.find(function (produto) {
    return produto.id === id;
  });

  if (itemExistente) {
    itemExistente.quantidade++;
  } else {
    pedido.push({
      ...item,
      quantidade: 1
    });
  }

  elementoStatus.textContent = "";
  mostrarPedido();
}

function removerDoPedido(id) {
  pedido = pedido.filter(function (item) {
    return item.id !== id;
  });

  mostrarPedido();
}

async function carregarCardapio() {
  elementoAviso.textContent = "Carregando cardápio...";
  elementoCardapio.replaceChildren();

  try {
    const resultados = await Promise.all([
      buscarDados("cardapio.json"),
      buscarDados("promocoes.json")
    ]);

    cardapio = aplicarPromocoes(resultados[0], resultados[1]);

    mostrarCardapio(filtrarPorCategoria(elementoFiltro.value));

    elementoAviso.textContent = "";
  } catch (erro) {
    elementoAviso.textContent =
      "Erro ao carregar o cardápio. Verifique os arquivos JSON.";

    console.error(erro);
  }
}

// 4. EVENTOS

elementoFiltro.addEventListener("change", function () {
  mostrarCardapio(filtrarPorCategoria(elementoFiltro.value));
});

function enviarPedido(itens) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (Math.random() < 0.3) {
        reject(new Error("Não foi possível enviar o pedido."));
      } else {
        resolve({
          numero: Math.floor(1000 + Math.random() * 9000)
        });
      }
    }, 2000);
  });
}

botaoFinalizar.addEventListener("click", async function () {
  if (pedido.length === 0) {
    elementoStatus.textContent =
      "Adicione pelo menos um produto ao pedido.";
    return;
  }

  const itensEnviados = pedido.map(function (item) {
    return { ...item };
  });

  botaoFinalizar.disabled = true;
  elementoStatus.textContent = "Enviando pedido...";

  try {
    const resultado = await enviarPedido(itensEnviados);

    elementoStatus.textContent =
      "Pedido #" + resultado.numero + " confirmado!";

    pedido = [];
    mostrarPedido();
  } catch (erro) {
    elementoStatus.textContent =
      erro.message + " Tente novamente.";
  } finally {
    botaoFinalizar.disabled = false;
  }
});

// Inicia o site

mostrarPedido();
carregarCardapio();