function adicionarTipo_de_Pendencia() {

    const selectElement = document.getElementById('tipo_de_pendencia');
    const id_tipo_de_pendencia = selectElement.value;
    const tipo_de_pendencia = selectElement.options[selectElement.selectedIndex].text;

    if (!tipo_de_pendencia) {
        focusCampo('tipo_de_pendencia');
        Swal.fire({
            title: 'Erro',
            text: 'Selecione o tipo de pendência',
            icon: 'error',
        });
        return;
    }

    const pendencia = document.getElementById('pendencia').value;
    if (!pendencia) {
        focusCampo('pendencia');
        Swal.fire({
            title: 'Erro',
            text: 'Informe a pendencia',
            icon: 'error',
        });
        return;
    }

    // Envio via AJAX para a rota 'subgrupo_inserir'
    $.ajax({
        url: tipo_de_pendenciaInserirUrl,
        type: 'POST',
        data: {
            id_tipo_de_pendencia: id_tipo_de_pendencia,
            tipo_de_pendencia: tipo_de_pendencia,
            pendencia: pendencia,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            if (response.success) {
                // Criar a nova linha
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td class="id_tipo_de_pendencia" style="display:none;">${response.id}</td>
                    <td class="tipo_de_pendencia text-center">${tipo_de_pendencia}</td>
                    <td class="pendencia text-center">${pendencia}</td>
                    <td class="ativo text-center">
                        <input type="checkbox" class="form-check-input" disabled checked>
                    </td>
                    <td class="text-center">
                        <button type="button" class="btn custom_02-btn btn-sm btn-edit" onclick="editRowTipo_de_Pendencia(this)">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteRowTipo_de_Pendencia(this)">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;

                // Adicionar a nova linha à tabela
                document.querySelector('#tbTipo_de_Pendencias tbody').appendChild(newRow);

                // Exibir mensagem de sucesso
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Pendência adicionada com sucesso!',
                    icon: 'success',
                    timer: 3000,
                });

                // Limpar os campos do formulário
                //document.getElementById('formSubgrupo').reset();
                document.getElementById('pendencia').value = '';
            } else {
                Swal.fire({
                    title: 'Erro',
                    text: response.message || 'Não foi possível adicionar a pendência.',
                    icon: 'error',
                });
            }
        },
        error: function () {
            Swal.fire({
                title: 'Erro',
                text: response.message || 'Erro na comunicação com o servidor.',
                icon: 'error',
            });
        }
    });
}

function editRowTipo_de_Pendencia(button) {
    const row = button.closest('tr'); // Obtém a linha correspondente ao botão clicado

    // Seleciona as células relevantes
    const tipoPendenciaCell = row.querySelector('.tipo_de_pendencia');
    const pendenciaCell = row.querySelector('.pendencia');
    const ativoCheckbox = row.querySelector('.ativo input');

    let tiposDePendencia; // Variável para armazenar os tipos de pendência
    const tipoPendenciaAtual = tipoPendenciaCell.textContent.trim(); // Tipo de pendência atual

    // Faz o fetch para obter os tipos de pendência
    fetch(obterTPs)
    .then(response => response.json())
    .then(data => {
        const tiposDePendencia = data.tiposDePendencia; // Lista de objetos {id, conteudo}

        let selectHTML = `
            <select class="form-select form-select-sm" id="tipo_de_pendencia" name="tipo_de_pendencia" required>
                <option value="" disabled selected hidden></option>
        `;

        // Adiciona cada tipo de pendência como uma opção
        tiposDePendencia.forEach(tipo => {
            if (tipoPendenciaAtual === tipo.conteudo) {
                selectHTML += `<option value="${tipo.id}" selected>${tipo.conteudo}</option>`;
            } else {
                selectHTML += `<option value="${tipo.id}">${tipo.conteudo}</option>`;
            }
        });

        // Fecha o select
        selectHTML += `</select>`;

        // Atualiza o conteúdo do elemento com o novo select
        tipoPendenciaCell.innerHTML = selectHTML;

        // Atualiza a célula de pendência com um campo de texto
        pendenciaCell.innerHTML = `
            <input type="text" class="form-control form-control-sm" value="${pendenciaCell.textContent.trim()}">
        `;

        // Habilita o checkbox
        ativoCheckbox.disabled = false;

        // Altera o botão para "Salvar"
        button.innerHTML = '<i class="fas fa-save"></i>';
        button.onclick = function () {
            saveRowTipo_de_Pendencia(row, button);
        };
    })
    .catch(error => console.error('Erro ao buscar tipos de pendência:', error));
}

function saveRowTipo_de_Pendencia(row, button) {
    // Captura o valor da célula id_pendencia
    const idPendenciaCell = row.querySelector('.id_pendencia');
    const id_pendencia = idPendenciaCell ? idPendenciaCell.textContent.trim() : null;

    // Captura o valor do select para o tipo de pendência
    const tipoPendenciaSelect = row.querySelector('.tipo_de_pendencia select');
    const tipo_de_pendencia = tipoPendenciaSelect ? tipoPendenciaSelect.options[tipoPendenciaSelect.selectedIndex].text : '';
    const id_tipo_de_pendencia = tipoPendenciaSelect ? tipoPendenciaSelect.value.trim() : '';

    // Captura o campo de texto da pendência
    const pendenciaInput = row.querySelector('.pendencia input');
    const pendencia = pendenciaInput ? pendenciaInput.value.trim() : '';

    // Captura o valor do checkbox de ativo
    const ativo = row.querySelector('.ativo input').checked;

    // Validação para campos obrigatórios
    if (!pendencia) {
        Swal.fire({
            title: 'Erro',
            text: 'O campo "Pendência" não pode estar vazio!',
            icon: 'error',
        });
        pendenciaInput.focus(); // Coloca o foco no campo pendência
        return;
    }

    if (!id_tipo_de_pendencia) {
        Swal.fire({
            title: 'Erro',
            text: 'O tipo de pendência deve ser selecionado!',
            icon: 'error',
        });
        tipoPendenciaSelect.focus(); // Coloca o foco no select de tipo de pendência
        return;
    }

    // Realiza a requisição AJAX para atualizar no backend
    $.ajax({
        url: tipo_de_pendenciaAtualizarUrl,
        type: 'POST',
        data: {
            id_pendencia: id_pendencia,
            id_tipo_de_pendencia: id_tipo_de_pendencia,
            tipo_de_pendencia: tipo_de_pendencia,
            pendencia: pendencia,
            ativo: ativo,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            Swal.fire({
                title: 'Sucesso',
                text: 'Pendência atualizada com sucesso!',
                icon: 'success',
                timer: 3000,
            });
            // Atualiza a tabela com os novos dados
            row.querySelector('.tipo_de_pendencia').textContent = tipo_de_pendencia;
            row.querySelector('.pendencia').textContent = pendencia;
            row.querySelector('.ativo input').disabled = true;
        },
        error: function (response) {
            Swal.fire({
                title: 'Erro',
                text: response.message || 'Erro ao atualizar a pendência.',
                icon: 'error',
            });
        }
    });

    // Altera o botão de salvar de volta para editar
    button.innerHTML = '<i class="fas fa-edit"></i>';
    button.onclick = function () {
        editRowTipo_de_Pendencia(button);
    };
}


function deleteRowTipo_de_Pendencia(button) {
    // Obter a linha onde o botão foi clicado
    const row = button.closest('tr');
    const id_pendencia = row.querySelector('.id_pendencia').textContent.trim();

    const pendencia = row.querySelector('.pendencia').textContent.trim();

    // Exibir a confirmação de exclusão
    Swal.fire({
        title: 'Confirmação',
        text: `Tem certeza que deseja excluir a pendência "${pendencia}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            // Enviar a solicitação para exclusão via AJAX
            $.ajax({
                url: tipo_de_pendenciaExcluirUrl, // Rota de exclusão
                type: 'POST',
                data: {
                    id_pendencia: id_pendencia,
                    csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                success: function (response) {
                    if (response.success) {
                        // Remover a linha da tabela
                        row.remove();
                        Swal.fire({
                            title: 'Sucesso',
                            text: 'Pendência excluída com sucesso!',
                            icon: 'success',
                            timer: 3000,
                        });
                    } else {
                        Swal.fire({
                            title: 'Erro',
                            text: response.message || 'Não foi possível excluir a pendência.',
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

document.addEventListener("DOMContentLoaded", function () {
    const tipoDePendenciaInput = document.getElementById("tipo_de_pendencia");
    const pendenciaInput = document.getElementById("pendencia");
    const tableRows = document.querySelectorAll("#tbTipo_de_Pendencias tbody tr");

    // Função para filtrar a tabela
    function filtrarTabela() {
        const tipoDePendenciaValue = tipoDePendenciaInput.value; // O valor selecionado do dropdown (id do tipo de pendência)
        const pendenciaValue = pendenciaInput.value.toLowerCase();

        tableRows.forEach(row => {
            const idTipoDePendenciaCell = row.querySelector(".id_tipo_de_pendencia").textContent.trim(); // id do tipo de pendência
            const pendenciaCell = row.querySelector(".pendencia").textContent.toLowerCase();

            // Verifica se os valores dos campos estão contidos nas células correspondentes
            const matchesTipoDePendencia = !tipoDePendenciaValue || idTipoDePendenciaCell === tipoDePendenciaValue;
            const matchesPendencia = pendenciaCell.includes(pendenciaValue) || !pendenciaValue;

            // Exibe ou oculta a linha com base nos critérios de filtragem
            if (matchesTipoDePendencia && matchesPendencia) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    // Adicionar ouvintes de evento para os campos de filtro
    tipoDePendenciaInput.addEventListener("change", filtrarTabela);
    pendenciaInput.addEventListener("input", filtrarTabela);
});
