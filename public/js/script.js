const POKEAPI = "https://pokeapi.co/api/v2/pokemon"
const POEKAPI_SPECIES = "https://pokeapi.co/api/v2/pokemon-species"



//querySelector reutilizable
function select(selection) {
  return document.querySelector(selection);
};

//querySelectorAll reutilizable
function selectAll(selection) {
  return document.querySelectorAll(selection);
};

//createElement reutilizable
function create(selection) {
  return document.createElement(selection);
};



//Mostrar u ocultar las diferentes pantallas
function showScreen(screenId) {
  for (const screen of selectAll(".screen-section")) {
    screen.classList.toggle("hidden", screen.id !== screenId);
  };
};

//Obtener número de pokemon
async function getPokemonCount() {
  const response = await fetch(POEKAPI_SPECIES + "?limit=1");
  const data = await response.json();

  return data.count;
};

//Cargar ranking
async function loadLeaderboard() {
  const status = select("#leaderboard-status");
  const body = select("#leaderboard-body");

  status.textContent = "Cargando puntuaciones...";
  body.replaceChildren();

  const response = await fetch("./api/leaderboard.php");
  const data = await response.json();

  for (let i = 0; i < data.scores.length; i++) {
    const entry = data.scores[i];
    const row = create("tr");

    const values = [i + 1, entry.nombre, entry.puntos, entry.tiempoRestante + "s"];

    for (let j = 0; j < values.length; j++) {
      const cell = create("td");
      cell.textContent = String(values[j]);
      row.appendChild(cell);
    };

    body.appendChild(row);
  };

  status.textContent = "";
};

//Clase de carta del juego
class Card {
  constructor(sharedId) {
    this.sharedId = sharedId;
    this.turned = false;
    this.matched = false;
    this.pokemonUrl = POKEAPI + "/" + sharedId;
    this.pokemonImage = null;
    this.button = null;

    this.loadSprite();
  };

  //Cargar la imagen
  async loadSprite() {
    this.pokemonImage =
      await fetch(this.pokemonUrl)
        .then(r => r.json())
        .then(data => data.sprites.front_default);
  };

  //Girar la carta
  turn() {
    this.turned = !this.turned;
  };

  //Marcar la carta como emparejada
  match() {
    this.turned = true;
    this.matched = true;
  };
};

//Clase del tablero del juego

class Board {
  constructor(container, pokemonCount, game) {
    this.container = container;
    this.pokemonCount = pokemonCount;
    this.game = game;
    this.cardCount = 30;

    this.cards = [];
    this.selectedCards = [];
  };

  //Limpiar la selección de cartas
  clearSelection() {
    this.selectedCards = [];
  };

  //Limpiar el tablero
  clearBoard() {
    this.clearSelection();
    this.container.replaceChildren();
    this.cards = [];
  };

  //Crear un mazo de cartas
  createDeck() {
    const pokemonIds = [];
    const pairCount = this.cardCount / 2;

    while (pokemonIds.length < pairCount) {
      const id = Math.floor(Math.random() * this.pokemonCount) + 1;
      if (!pokemonIds.includes(id)) {
        pokemonIds.push(id);
      };
    };

    for (const id of pokemonIds) {
      this.cards.push(new Card(id));
      this.cards.push(new Card(id));
    };

    this.cards.sort(() => Math.random() - 0.5);
  };

  //Renderizar una carta en el tablero
  renderCard(card) {
    const button = card.button;

    button.replaceChildren();

    if (card.turned) {
      const image = create("img");

      image.src = card.pokemonImage;

      button.appendChild(image);
    } else {
      button.textContent = "?";
    };

    button.disabled = card.matched;
  };

  //Manejar el click de una carta
  async handleCardClick(card) {
    if (this.selectedCards.length === 2 || card.turned || card.matched || this.game.finished) {
      return;
    };

    card.turn();
    this.selectedCards.push(card);
    this.renderCard(card);

    if (this.selectedCards.length < 2) {
      return;
    };

    const firstCard = this.selectedCards[0];
    const secondCard = this.selectedCards[1];

    if (firstCard.sharedId === secondCard.sharedId) {
      firstCard.match();
      secondCard.match();
      this.game.score += 2;
      this.game.updateStats();

      this.renderCard(firstCard);
      this.renderCard(secondCard);

      this.clearSelection();

      let allMatched = true;

      for (const boardCard of this.cards) {
        if (!boardCard.matched) {
          allMatched = false;
        };
      };

      if (allMatched) {
        this.game.finishGame("completed");
      };

      return;
    };

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!this.selectedCards.includes(firstCard)) {
      return;
    };

    firstCard.turn();
    secondCard.turn();

    this.renderCard(firstCard);
    this.renderCard(secondCard);

    this.game.score = Math.max(this.game.score - 1, 0);
    this.game.updateStats();

    this.clearSelection();
  };

  //Crear el tablero del juego
  async loadBoard() {
    this.clearBoard();
    this.createDeck();

    for (const card of this.cards) {
      const button = create("button");
      button.type = "button";
      button.className = "card";

      card.button = button;

      button.addEventListener("click", () => {
        this.handleCardClick(card);
      });

      this.renderCard(card);
      this.container.appendChild(button);
    };

    return true;
  };
};

// Clase del juego
class Game {
  constructor(board, pokemonCount) {
    this.currentName = "";
    this.score = 0;
    this.finalTime = 0;

    this.remainingSeconds = 60;

    this.timer = null;
    this.finished = false;
    this.board = new Board(board, pokemonCount, this);
  };

  //Actualizar las estadisticas del juego (tiempo y puntuación)
  updateStats() {
    select("#timer-value").textContent = this.remainingSeconds + "s";
    select("#score-value").textContent = String(this.score);
  };

  //Iniciar el temporizador
  startTimer() {
    this.timer = setInterval(() => {
      this.remainingSeconds--;

      this.updateStats();

      if (this.remainingSeconds === 0) {
        this.finishGame("timeout");
      };
    }, 1000);
  };

  //Parar el temporizador
  stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    };
  };

  //Iniciar el juego
  async startGame(name) {
    this.stopTimer();

    this.currentName = name;
    this.score = 0;
    this.remainingSeconds = 60;
    this.finished = false;

    select("#game-name-value").textContent = name;

    showScreen("game-screen");
    this.updateStats();

    const boardReady = await this.board.loadBoard();

    this.startTimer();
  };

  //Enviar los datos a MongoDB
  async sendFinalData(name, score, time) {
    const response = await fetch("./api/send.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: name,
        puntos: score,
        tiempoRestante: time
      })
    });

    return response.json();
  }

  //Finalizar el juego
  finishGame(reason) {
    this.finished = true;

    this.stopTimer();
    this.board.clearSelection();

    const bonus = reason === "completed" && this.remainingSeconds > 0 ? 40 : 0;

    const finalScore = this.score + bonus;

    const message = (() => {
      if (reason === "completed") {
        return "Bien hecho, completaste el tablero por 40 puntos extra";
      } else if (reason === "timeout") {
        return "Se te acabó el tiempo";
      };
    })();

    select("#result-description").textContent = message;

    select("#result-name-value").textContent = this.currentName;
    select("#final-score").textContent = String(finalScore);
    select("#final-time").textContent = this.remainingSeconds + "s";

    this.sendFinalData(this.currentName, finalScore, this.remainingSeconds);

    showScreen("result-screen");
  };

  //Salir del juego
  quit() {
    this.stopTimer();
    this.board.clearBoard();

    this.finished = true;

    showScreen("menu-screen");
  };
};

function initializeApp(pokemonCount) {
  showScreen("menu-screen");
  const boardContainer = select("#board");
  const game = new Game(boardContainer, pokemonCount);

  select("#start-button").addEventListener("click", function () {
    select("#name-input").value = "";

    showScreen("name-screen");
  });

  select("#name-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = select("#name-input").value.trim();

    game.startGame(name);
  });

  const backButtons = selectAll(".back-button");

  backButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      game.quit();
      loadLeaderboard();
    });
  });

  select("#quit-button").addEventListener("click", function () {
    game.quit();
  });

  select("#play-again-button").addEventListener("click", function () {
    game.startGame(game.currentName);
  });

  loadLeaderboard();
};

const pokemonCount = await getPokemonCount();
initializeApp(pokemonCount);