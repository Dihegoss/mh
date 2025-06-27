//---------------------------------------------------------\\
//---------------------------------------------------------\\
//                                                         \\
//---------------------------------------------------------\\
//---------------------------------------------------------\\

const c_App = 'MHDigital';

//---------------------------------------------------------\\
//---------------------------------------------------------\\
// Cálcula a altura da header dinamicamente e seta o valor \\
// do padding-top de acordo com a altura                   \\
//---------------------------------------------------------\\
//---------------------------------------------------------\\
function atualizarLayout() {
    const header = document.querySelector("header");
    const conteudo = document.querySelector(".div-conteudo");
    if (header && conteudo) {
        const headerHeight = header.offsetHeight;
        console.log("Header height:", headerHeight); // Depuração
        conteudo.style.paddingTop = `${headerHeight}px`;
        document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    }
}

document.addEventListener("DOMContentLoaded", atualizarLayout);
window.addEventListener("resize", atualizarLayout);


function focusCampo(id_Campo) {
  // Seleciona o campo de texto com base no ID passado como parâmetro
  var inputField = document.getElementById(id_Campo);

  // Verifica se o campo existe
  if (inputField) {
      // Rola a página para que o campo fique visível
      inputField.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Foca o campo após a rolagem
      inputField.focus();
  }
}

function criarSelectDinamico(id_select_original, valor_selecionado_atual) {
    // Cria um novo elemento <select>
    var novoSelect = document.createElement('select');
    novoSelect.className = 'form-select form-select-sm';  // Adiciona classes de estilo

    var select_orginal = document.getElementById(id_select_original);

    // Loop através das opções do select original
    for (var i = 0; i < select_orginal.options.length; i++) {
        var opcaoOriginal = select_orginal.options[i];  // Obtém a opção original

        // Cria uma nova <option> para o novo select
        var novaOption = document.createElement('option');
        novaOption.value = opcaoOriginal.value;  // Define o valor com base na opção original
        novaOption.text = opcaoOriginal.text;    // Define o texto com base na opção original

        // Verifica se esta é a opção selecionada
        if (opcaoOriginal.text === valor_selecionado_atual) {
            novaOption.selected = true; // Marca a opção como selecionada
        }

        // Adiciona a nova opção ao novo select
        novoSelect.appendChild(novaOption);
    }

    // Retorna o novo select criado
    return novoSelect;
}

function em_construcao(event) {
    // Evita que o link seja seguido
    event.preventDefault();

    // Array com as URLs dos GIFs
    const gifUrls = [
        'https://www.imagensanimadas.com/data/media/695/em-construcao-imagem-animada-0035.gif',
        'https://www.imagensanimadas.com/data/media/36/medico-imagem-animada-0055.gif',
        'https://www.imagensanimadas.com/data/media/36/medico-imagem-animada-0004.gif',
        'https://www.imagensanimadas.com/data/media/36/medico-imagem-animada-0013.gif',
        'https://i.gifer.com/1QkN.gif',
    ];

    // Seleciona uma URL aleatória
    const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];

    Swal.fire({
        title: 'Página em construção!',
        text: 'Estamos trabalhando nisso.',
        imageUrl: randomGifUrl, // URL escolhida aleatoriamente
        imageWidth: 400,
        imageHeight: 200,
        confirmButtonText: 'Entendido',
    });
}

// Função para aplicar a máscara de CPF no campo input
function mascaraCPF(cpf) {
    cpf = cpf.replace(/\D/g, ""); // Remove caracteres não numéricos
    cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca o primeiro ponto
    cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca o segundo ponto
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca o traço
    return cpf;
}

function formatarCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarDataParaInput(dataHora) {
    // Separando a data e a hora
    let [data, hora] = dataHora.split(" ");
    
    // Separando dia, mês e ano
    let [dia, mes, ano] = data.split("/");
    
    // Formatando no padrão "YYYY-MM-DDTHH:MM"
    return `${ano}-${mes}-${dia}T${hora}`;
}