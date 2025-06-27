function adicionarUsuario() {
    const nome = document.getElementById('nome').value;
    if (!nome) {
        focusCampo('nome')
        Swal.fire({
            title: c_App,
            text: 'Informar o nome do usuárioxxx',
            icon: "error",
        });
        return;
    }

    const cpf = document.getElementById('cpf').value;
    if (!cpf) {
        focusCampo('cpf')
        Swal.fire({
            title: c_App,
            text: 'Informar o CPF do usuário',
            icon: "error",
        });
        return;
    }

    const perfilValor = document.getElementById('perfil').value;
    const perfilConteudo = document.getElementById('perfil').options[document.getElementById('perfil').selectedIndex].text;
    if (!perfilValor) {
        focusCampo('perfil')
        Swal.fire({
            title: c_App,
            text: 'Informar o perfil do usuário',
            icon: "error",
        });
        return;
    }

    const ativoValor = document.getElementById('ativo').value;
    const ativoConteudo = document.getElementById('ativo').options[document.getElementById('ativo').selectedIndex].text;
    if (!ativoValor) {
        focusCampo('ativo');
        Swal.fire({
            title: c_App,
            text: 'Informar se usuário ativo ou não',
            icon: "error",
        });
        return;
    }

    const selectElement = document.getElementById('estabelecimento');
    const estabelecimentoValor = selectElement.value;
    const estabelecimentoConteudo = selectElement.options[selectElement.selectedIndex].text;

    if ( perfilValor === "GestorEstabelecimento" || perfilValor === "OperadorEstabelecimento" ) {
        if ( !estabelecimentoValor ) {
            focusCampo('estabelecimento');
            Swal.fire({
                title: c_App,
                text: 'Informe o estabelecimento',
                icon: "error",
            });
            return;
        }
    }

    // Envio via AJAX para a rota 'usuario_inserir'
    $.ajax({
        url: usuarioInserirUrl,  // Altere para o URL correto de sua rota
        type: 'POST',
        data: {
            nome: nome,
            cpf: cpf,
            perfilValor: perfilValor,
            perfilConteudo: perfilConteudo,
            estabelecimentoValor: estabelecimentoValor,
            estabelecimentoConteudo: estabelecimentoConteudo,
            ativoValor: ativoValor,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value, // Inclui o CSRF Token para segurança
        },
        success: function (response) {
            // Verificando se a resposta foi bem-sucedida
            if (response.success) {
                // Adiciona a nova linha na tabela
                const tableBody = document.getElementById('tbUsuarios').getElementsByTagName('tbody')[0];
                const newRow = tableBody.insertRow();

                // Insere as células da nova linha com os dados recebidos
                newRow.innerHTML = `
                    <td class="id_usuario" style="display:none;">${response.id}</td>
                    <td class="nome">${nome}</td>
                    <td class="cpf text-center">${cpf}</td>
                    <td class="perfil text-center">${perfilConteudo}</td>
                    <td class="estabelecimento text-center">${estabelecimentoConteudo}</td>
                    <td class="ativo text-center"><input type="checkbox" class="form-check-input" disabled ${ativo === 'Sim' ? 'checked' : ''}></td>
                    <td class="ativo text-center"><input type="checkbox" class="form-check-input" disabled checked></td>
                    <td class="text-center">
                    <button type="button" class="btn custom_02-btn btn-sm btn-edit" onclick="editRowUsuario(this)"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteRowUsuario(this)"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;

                Swal.fire({
                    title: c_App,
                    text: 'Usuário adicionado com sucesso!',
                    icon: "success",
                    timer: 3000,
                });

                // Limpa os campos do formulário
                document.getElementById('formUsuario').reset();
            } else {
                // Caso algo tenha dado errado
                Swal.fire({
                    title: c_App,
                    text: response.message || 'Erro ao adicionar o usuário.',
                    icon: "error",
                });
            }
        },
        error: function () {
            // Caso ocorra um erro na requisição AJAX
            Swal.fire({
                title: c_App,
                text: 'Erro na comunicação com o servidor.',
                icon: "error",
            });
        }
    });

}


function editRowUsuario(button) {
    const row = button.closest('tr');
    const nomeCell = row.querySelector('.nome');
    const cpfCell = row.querySelector('.cpf');
    const perfil_usuarioCell = row.querySelector('.perfil');
    const termo_usoCell = row.querySelector('.termo_uso input');
    const estabelecimentoCell = row.querySelector('.estabelecimento');
    const ativoCell = row.querySelector('.ativo input');

    nomeCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${nomeCell.textContent.trim()}">`;
    cpfCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${cpfCell.textContent.trim()}">`;
    termo_usoCell.disabled = false;
    ativoCell.disabled = false;

    const perfil_usuarioAtual = perfil_usuarioCell.textContent.trim();
    console.log("Perfil atual:", perfil_usuarioAtual);

    fetch(obterPerfisUsuario)
        .then(response => response.json())
        .then(data => {
            console.log("Perfis recebidos:", data);
            const perfis_usuario = data.perfis_usuario;

            let selectHTML = `
                <select class="form-select form-select-sm" id="perfil" name="perfil" required>
                    <option value="" disabled selected hidden>Selecione um perfil</option>
            `;

            perfis_usuario.forEach(perfil_usuario => {
                if (perfil_usuario === perfil_usuarioAtual) {
                    selectHTML += `<option value="${perfil_usuario}" selected>${perfil_usuario}</option>`;
                } else {
                    selectHTML += `<option value="${perfil_usuario}">${perfil_usuario}</option>`;
                }
            });

            selectHTML += `</select>`;
            perfil_usuarioCell.innerHTML = selectHTML;
            console.log("Célula de perfil atualizada com select");
        })
        .catch(error => console.error('Erro ao buscar perfis de usuário:', error));

    const estabelecimentoAtual = estabelecimentoCell.textContent.trim();
    console.log("Estabelecimento atual:", estabelecimentoAtual);

    fetch(obterEstabelecimentos)
        .then(response => response.json())
        .then(data => {
            console.log("Estabelecimentos recebidos:", data);
            const estabelecimentos = data.estabelecimentos;

            let selectHTML = `
                <select class="form-select form-select-sm" id="estabelecimento" name="estabelecimento" required>
                    <option value=""></option>
            `;

            estabelecimentos.forEach(estabelecimento => {
                if (estabelecimento.nome === estabelecimentoAtual) {
                    selectHTML += `<option value="${estabelecimento.id}" selected>${estabelecimento.nome}</option>`;
                } else {
                    selectHTML += `<option value="${estabelecimento.id}">${estabelecimento.nome}</option>`;
                }
            });

            selectHTML += `</select>`;
            estabelecimentoCell.innerHTML = selectHTML;
        })
        .catch(error => console.error('Erro ao buscar estabelecimentos:', error));

    button.innerHTML = '<i class="fas fa-save"></i>';
    button.onclick = function () {
        saveRowUsuario(row, button);
    };
}



function saveRowUsuario(row, button) {
    // Capturar os novos valores dos campos
    const id_usuario = row.querySelector('.id_usuario').textContent.trim();
    const nome = row.querySelector('.nome input').value.trim();
    const cpf = row.querySelector('.cpf input').value.trim();
    const perfil = row.querySelector('.perfil select').value; // Seleciona o valor do select
    const estabelecimento = row.querySelector('.estabelecimento select').value; // Seleciona o valor do select
    const ativo = row.querySelector('.ativo input').checked;

    // Validar os campos (exemplo básico)
    if (!nome) {
        Swal.fire({
            title: 'Erro',
            text: 'Informe o nome do usuário',
            icon: 'error',
        });
        return;
    }

    if (!cpf) {
        Swal.fire({
            title: 'Erro',
            text: 'Informe o CPF do usuário',
            icon: 'error',
        });
        return;
    }

    if (!perfil) {
        Swal.fire({
            title: 'Erro',
            text: 'Informe o perfil do usuário',
            icon: 'error',
        });
        return;
    }

    if ( perfil === "Gestor Estabelecimento"    || 
         perfil === "Operador Estabelecimento"  || 
         perfil === "Visualizador Estabelecimento" ) {
        if ( !estabelecimento ) {
            let estabelecimentoCell = row.querySelector('.estabelecimento');
            let input = estabelecimentoCell.querySelector('input, select');
            if (input) {
                input.focus();
            }
            Swal.fire({
                title: c_App,
                text: 'Informe o estabelecimento',
                icon: "error",
            });
            return;
        }
    }    

    // Substituir os inputs pelos valores
    row.querySelector('.nome').textContent = nome;
    row.querySelector('.cpf').textContent = cpf;
    row.querySelector('.perfil').textContent = row.querySelector('.perfil select option:checked').textContent;
    row.querySelector('.estabelecimento').textContent = row.querySelector('.estabelecimento select option:checked').textContent;
    row.querySelector('.ativo input').disabled = true;

    // Enviar a atualização para o servidor (via AJAX)
    $.ajax({
        url: usuarioAtualizarUrl, // Rota de atualização
        type: 'POST',
        data: {
            id_usuario: row.querySelector('.id_usuario').textContent.trim(),
            nome: nome,
            cpf: cpf,
            perfil: perfil,
            estabelecimento: estabelecimento,
            ativo: ativo,
            csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        success: function (response) {
            Swal.fire({
                title: 'Sucesso',
                text: 'Usuário atualizado com sucesso!',
                icon: 'success',
                timer: 3000,
            });
        },
        error: function (response) {
            Swal.fire({
                title: 'Erro',
                text: response.message || 'Não foi possível atualizar o usuário.',
                icon: 'error',
            });
        },
    });

    // Alterar o botão para "Editar"
    button.innerHTML = '<i class="fas fa-edit"></i>';
    button.onclick = function () {
        editRowUsuario(button);
    };
}



function deleteRowUsuario(button) {
    // Obter a linha onde o botão foi clicado
    const row = button.closest('tr');
    const id = row.querySelector('.id_usuario').textContent.trim();

    // Exibir a confirmação de exclusão
    Swal.fire({
        title: 'Confirmação',
        text: 'Tem certeza que deseja excluir este usuário?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            // Enviar a solicitação para exclusão via AJAX
            $.ajax({
                url: usuarioExcluirUrl, // Rota de exclusão
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
                            text: 'Usuário excluído com sucesso!',
                            icon: 'success',
                            timer: 3000,
                        });
                    } else {
                        Swal.fire({
                            title: 'Erro',
                            text: response.message || 'Não foi possível excluir o usuário.',
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

// Evento para aplicar a máscara no campo input
document.getElementById("cpf").addEventListener("input", function (e) {
    e.target.value = mascaraCPF(e.target.value);
});