function adicionarEstabelecimento() {
  const nome = document.getElementById('nome').value;
  if( !nome ) {
    focusCampo('nome')
    Swal.fire({
      title: c_App,
      text: 'Informar o nome do estabelecimento',
      icon: "error",
    });
    return;
  }

  const sigla = document.getElementById('sigla').value;
  if( !sigla ) {
    focusCampo('sigla')
    Swal.fire({
      title: c_App,
      text: 'Informar a sigla do estabelecimento',
      icon: "error",
    });
    return;
  }

  const cnes = document.getElementById('cnes').value;
  if( !cnes ) {
    focusCampo('cnes')
    Swal.fire({
      title: c_App,
      text: 'Informar o CNES do estabelecimento',
      icon: "error",
    });
    return;    
  }
  
  const mvValor = document.getElementById('mv').value;
  const mvConteudo = document.getElementById('mv').options[document.getElementById('mv').selectedIndex].text;
  if( !mvValor ) {
    focusCampo('mv');
    Swal.fire({
      title: c_App,
      text: 'Informar se o estabelecimento possui o sistema MV',
      icon: "error",
    });
    return;
  }
  
  // Envio via AJAX para a rota 'estabelecimento_inserir'
  $.ajax({
    url: estabelecimentoInserirUrl,  // Altere para o URL correto de sua rota
    type: 'POST',
    data: {
      nome: nome,
      sigla: sigla,
      cnes: cnes,
      mvValor: mvValor,
      csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value, // Inclui o CSRF Token para segurança
    },
    success: function(response) {
      // Verificando se a resposta foi bem-sucedida
      if (response.success) {
        // Adiciona a nova linha na tabela
        const tableBody = document.getElementById('tbEstabelecimentos').getElementsByTagName('tbody')[0];
        const newRow = tableBody.insertRow();

        // Insere as células da nova linha com os dados recebidos
        newRow.innerHTML = `
          <td class="id_estabelecimento" style="display:none;">${response.id}</td>
          <td class="nome">${nome}</td>
          <td class="sigla text-center">${sigla}</td>
          <td class="cnes text-center">${cnes}</td>
          <td class="mv text-center"><input type="checkbox" class="form-check-input" disabled ${mvValor === 'Sim' ? 'checked' : ''}></td>
          <td class="ativo text-center"><input type="checkbox" class="form-check-input" disabled checked></td>
          <td class="text-center">
            <button type="button" class="btn custom_02-btn btn-sm btn-edit" onclick="editRowEstabelecimento(this)"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteRowEstabelecimento(this)"><i class="fas fa-trash-alt"></i></button>
          </td>
        `;
        
        Swal.fire({
          title: c_App,
          text: 'Estabelecimento adicionado com sucesso!',
          icon: "success",
          timer: 3000,
        });

        // Limpa os campos do formulário
        document.getElementById('formEstabelecimento').reset();
      } else {
        // Caso algo tenha dado errado
        Swal.fire({
          title: c_App,
          text: response.message || 'Erro ao adicionar o estabelecimento.',
          icon: "error",
        });
      }
    },
    error: function(response) {
      // Caso ocorra um erro na requisição AJAX
      Swal.fire({
        title: c_App,
        text: response.message || 'Erro na comunicação com o servidor.',
        icon: "error",
      });
    }
  });  

}

function editRowEstabelecimento(button) {
  // Obter a linha onde o botão foi clicado
  const row = button.closest('tr');

  // Identificar as células da linha
  const nomeCell = row.querySelector('.nome');
  const siglaCell = row.querySelector('.sigla');
  const cnesCell = row.querySelector('.cnes');
  const mvCell = row.querySelector('.mv input');

  // Transformar os valores em campos editáveis
  nomeCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${nomeCell.textContent.trim()}">`;
  siglaCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${siglaCell.textContent.trim()}">`;
  cnesCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${cnesCell.textContent.trim()}">`;
  mvCell.disabled = false;

  // Alterar o botão para "Salvar"
  button.innerHTML = '<i class="fas fa-save"></i>';
  button.onclick = function () {
    saveRowEstabelecimento(row, button);
  };
}

function saveRowEstabelecimento(row, button) {
  // Capturar os novos valores dos campos
  const nome = row.querySelector('.nome input').value.trim();
  const sigla = row.querySelector('.sigla input').value.trim();
  const cnes = row.querySelector('.cnes input').value.trim();
  const mv = row.querySelector('.mv input').checked;

  // Validar os campos (exemplo básico)
  if (!nome || !sigla || !cnes) {
    Swal.fire({
      title: 'Erro',
      text: 'Todos os campos são obrigatórios!',
      icon: 'error',
    });
    return;
  }

  // Substituir os inputs pelos valores
  row.querySelector('.nome').textContent = nome;
  row.querySelector('.sigla').textContent = sigla;
  row.querySelector('.cnes').textContent = cnes;
  row.querySelector('.mv input').disabled = true;

  // Enviar a atualização para o servidor (via AJAX)
  $.ajax({
    url: estabelecimentoAtualizarUrl, // Rota de atualização
    type: 'POST',
    data: {
      id: row.querySelector('.id_estabelecimento').textContent.trim(),
      nome: nome,
      sigla: sigla,
      cnes: cnes,
      mv: mv,
      csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
    },
    success: function (response) {
      Swal.fire({
        title: 'Sucesso',
        text: 'Estabelecimento atualizado com sucesso!',
        icon: 'success',
        timer: 3000,
      });
    },
    error: function (response) {
      Swal.fire({
        title: 'Erro',
        text: response.message || 'Não foi possível atualizar o estabelecimento.',
        icon: 'error',
      });
    },
  });

  // Alterar o botão para "Editar"
  button.innerHTML = '<i class="fas fa-edit"></i>';
  button.onclick = function () {
    editRowEstabelecimento(button);
  };
}

function deleteRowEstabelecimento(button) {
  // Obter a linha onde o botão foi clicado
  const row = button.closest('tr');
  const id = row.querySelector('.id_estabelecimento').textContent.trim();

  // Exibir a confirmação de exclusão
  Swal.fire({
    title: 'Confirmação',
    text: 'Tem certeza que deseja excluir este estabelecimento?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
  }).then((result) => {
    if (result.isConfirmed) {
      // Enviar a solicitação para exclusão via AJAX
      $.ajax({
        url: estabelecimentoExcluirUrl, // Rota de exclusão
        type: 'POST',
        data: {
          id: id,
          csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
          if (response.success) {
            // Remover a linha da tabela
            row.remove();
            Swal.fire({
              title: 'Sucesso',
              text: 'Estabelecimento excluído com sucesso!',
              icon: 'success',
              timer: 3000,
            });
          } else {
            Swal.fire({
              title: 'Erro',
              text: response.message || 'Não foi possível excluir o estabelecimento.',
              icon: 'error',
            });
          }
        },
        error: function () {
          Swal.fire({
            title: 'Erro',
            text: 'Não foi possível comunicar com o servidor.',
            icon: 'error',
          });
        },
      });
    }
  });
}

