function adicionarSubgrupo() {
    const grupo = document.getElementById('grupo').value;
    if (!grupo) {
        focusCampo('grupo');
        Swal.fire({
            title: 'Erro',
            text: 'Selecione o grupo',
            icon: 'error',
        });
        return;
    }

    const subgrupo = document.getElementById('subgrupo').value;
    if (!subgrupo) {
        focusCampo('subgrupo');
        Swal.fire({
            title: 'Erro',
            text: 'Informe o subgrupo',
            icon: 'error',
        });
        return;
    }

    // Envio via AJAX para a rota 'subgrupo_inserir'
    $.ajax({
        url: subgrupoInserirUrl,
        type: 'POST',
        data: {
            grupo: grupo,
            subgrupo: subgrupo,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            if (response.success) {
                // Criar a nova linha
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td class="id_subgrupo" style="display:none;">${response.id}</td>
                    <td class="grupo text-center">${grupo}</td>
                    <td class="subgrupo text-center">${subgrupo}</td>
                    <td class="ativo text-center">
                        <input type="checkbox" class="form-check-input" disabled checked>
                    </td>
                    <td class="text-center">
                        <button type="button" class="btn custom_02-btn btn-sm btn-edit" onclick="editRowSubgrupo(this)">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteRowSubgrupo(this)">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;

                // Adicionar a nova linha à tabela
                document.querySelector('#tbSubgrupos tbody').appendChild(newRow);

                // Exibir mensagem de sucesso
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Subgrupo adicionado com sucesso!',
                    icon: 'success',
                    timer: 3000,
                });

                // Limpar os campos do formulário
                //document.getElementById('formSubgrupo').reset();
                document.getElementById('subgrupo').value = '';
            } else {
                Swal.fire({
                    title: 'Erro',
                    text: response.message || 'Não foi possível adicionar o subgrupo.',
                    icon: 'error',
                });
            }
        },
        error: function (response) {
            Swal.fire({
                title: 'Erro',
                text: response.message || 'Erro na comunicação com o servidor.',
                icon: 'error',
            });
        }
    });
}


function editRowSubgrupo(button) {
    const row = button.closest('tr');
    
    const subgrupoCell = row.querySelector('.subgrupo');
    const grupoCell = row.querySelector('.grupo');
    const ativoCheckbox = row.querySelector('.ativo input');

    let grupos; // Declaração inicial
    const grupoAtual = grupoCell.textContent.trim(); // Obtém o grupo atual

    // Fetch para obter os grupos
    fetch(obterGrupos)
        .then(response => response.json())
        .then(data => {
            grupos = data.grupos; // Preenche os grupos com os dados retornados

            // Cria o select dinamicamente
            let selectHTML = `
                <select class="form-select form-select-sm" id="grupo" name="grupo" required>
                    <option value="" disabled selected hidden></option>
            `;

            // Adiciona cada grupo como uma opção
            grupos.forEach(grupo => {
                if (grupoAtual === grupo) {
                    selectHTML += `<option value="${grupo}" selected>${grupo}</option>`;
                } else {
                    selectHTML += `<option value="${grupo}">${grupo}</option>`;
                }
            });

            // Fecha o select
            selectHTML += `</select>`;

            // Define o conteúdo da célula com o novo select
            grupoCell.innerHTML = selectHTML;
        })
        .catch(error => console.error('Erro ao buscar grupos:', error));

        // Atualiza a célula de subgrupo
        subgrupoCell.innerHTML = `
        <input type="text" class="form-control form-control-sm" value="${subgrupoCell.textContent.trim()}">
            `;

        // Habilita o checkbox
        ativoCheckbox.disabled = false;

        // Altera o botão para "Salvar"
        button.innerHTML = '<i class="fas fa-save"></i>';
        button.onclick = function () {
            saveRowSubgrupo(row, button);
        };
}


function saveRowSubgrupo(row, button) {
    // Captura o valor do select para o grupo
    const grupoSelect = row.querySelector('.grupo select'); // Seleciona o <select>
    const grupo = grupoSelect ? grupoSelect.value.trim() : ''; // Obtém o valor selecionado
    
    const subgrupoInput = row.querySelector('.subgrupo input'); // Captura o campo de texto do subgrupo
    const subgrupo = subgrupoInput ? subgrupoInput.value.trim() : ''; // Obtém o valor do subgrupo
    
    const ativo = row.querySelector('.ativo input').checked; // Captura o valor do checkbox de ativo

    // Validação para campos obrigatórios
    if (!grupo || !subgrupo) {
        Swal.fire({
            title: 'Erro',
            text: 'Todos os campos são obrigatórios!',
            icon: 'error',
        });
        return;
    }

    // Atualiza os campos da tabela com os novos valores
    row.querySelector('.grupo').textContent = grupo;
    row.querySelector('.subgrupo').textContent = subgrupo;
    row.querySelector('.ativo input').disabled = true;

    // Realiza a requisição AJAX para atualizar no backend
    $.ajax({
        url: subgrupoAtualizarUrl,
        type: 'POST',
        data: {
            id_subgrupo: row.querySelector('.id_subgrupo').textContent.trim(),
            grupo: grupo,
            subgrupo: subgrupo,
            ativo: ativo,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            Swal.fire({
                title: 'Sucesso',
                text: 'Subgrupo atualizado com sucesso!',
                icon: 'success',
                timer: 3000,
            });
        },
        error: function (response) {
            Swal.fire({
                title: 'Erro',
                text: response.message || 'Erro ao atualizar o subgrupo.',
                icon: 'error',
            });
        }
    });

    // Altera o botão de salvar de volta para editar
    button.innerHTML = '<i class="fas fa-edit"></i>';
    button.onclick = function () {
        editRowSubgrupo(button);
    };
}



function deleteRowSubgrupo(button) {
    // Obter a linha onde o botão foi clicado
    const row = button.closest('tr');
    const id_subgrupo = row.querySelector('.id_subgrupo').textContent.trim();
    const subgrupo = row.querySelector('.subgrupo').textContent.trim();

    // Exibir a confirmação de exclusão
    Swal.fire({
        title: 'Confirmação',
        text: `Tem certeza que deseja excluir o subgrupo "${subgrupo}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            // Enviar a solicitação para exclusão via AJAX
            $.ajax({
                url: subgrupoExcluirUrl, // Rota de exclusão
                type: 'POST',
                data: {
                    id_subgrupo: id_subgrupo,
                    csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                success: function (response) {
                    if (response.success) {
                        // Remover a linha da tabela
                        row.remove();
                        Swal.fire({
                            title: 'Sucesso',
                            text: 'Subgrupo excluído com sucesso!',
                            icon: 'success',
                            timer: 3000,
                        });
                    } else {
                        Swal.fire({
                            title: 'Erro',
                            text: response.message || 'Não foi possível excluir o subgrupo.',
                            icon: 'error',
                        });
                    }
                },
                error: function (response) {
                    Swal.fire({
                        title: 'Erro',
                        text: response.message || 'Não foi possível comunicar com o servidor.',
                        icon: 'error',
                    });
                },
            });
        }
    });
}

//Filtrar os dados da tabela de acordo com o grupo selecionado
document.addEventListener('DOMContentLoaded', function () {
    const grupoSelect = document.getElementById('grupo');
    const subgrupoInput = document.getElementById('subgrupo');
    const tabela = document.getElementById('tbSubgrupos');
    const tbody = tabela.querySelector('tbody');

    // Função para filtrar a tabela
    function filtrarTabela() {
        const grupoSelecionado = grupoSelect.value.trim().toLowerCase();
        const subgrupoDigitado = subgrupoInput.value.trim().toLowerCase();

        Array.from(tbody.rows).forEach(row => {
            const grupo = row.querySelector('.grupo').textContent.trim().toLowerCase();
            const subgrupo = row.querySelector('.subgrupo').textContent.trim().toLowerCase();

            const grupoMatch = grupoSelecionado === '' || grupo === grupoSelecionado;
            const subgrupoMatch = subgrupoDigitado === '' || subgrupo.includes(subgrupoDigitado);

            // Exibe a linha apenas se ambos os critérios forem atendidos
            if (grupoMatch && subgrupoMatch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Evento para mudança no select de grupo
    grupoSelect.addEventListener('change', filtrarTabela);

    // Evento para digitação no campo subgrupo
    subgrupoInput.addEventListener('input', filtrarTabela);
});