document.addEventListener("DOMContentLoaded", function () {
    let rowsPerPage = 50; // Define o número de registros por página
    const tableBody = document.getElementById("tableBody");
    const rows = Array.from(tableBody.getElementsByTagName("tr"));
    const pagination = document.getElementById("pagination");
    const filterPaciente = document.getElementById("filterPaciente");
    const filterMedico = document.getElementById("filterMedico");
    const filterEnfermeiro = document.getElementById("filterEnfermeiro");
    const filterPendencia = document.getElementById("filterPendencia");
    
    let currentPage = 1;
    let filteredRows = [...rows];
    
    // Criar container para seletor estilizado
    const rowsPerPageContainer = document.createElement("div");
    rowsPerPageContainer.className = "d-flex align-items-center mb-2";
    
    const label = document.createElement("label");
    label.textContent = "Quantidade de registros por página: ";
    label.className = "me-2";
    
    const rowsPerPageSelect = document.createElement("select");
    rowsPerPageSelect.className = "form-select w-auto";
    rowsPerPageSelect.innerHTML = "<option value='5'>5</option><option value='10'>10</option><option value='50'>50</option><option value='100'>100</option><option value='1000'>1000</option><option value='10000'>10000</option>";
    rowsPerPageSelect.value = rowsPerPage;
    rowsPerPageSelect.addEventListener("change", function () {
        rowsPerPage = parseInt(this.value);
        currentPage = 1;
        showPage(currentPage);
    });
    
    rowsPerPageContainer.appendChild(label);
    rowsPerPageContainer.appendChild(rowsPerPageSelect);
    pagination.parentNode.insertBefore(rowsPerPageContainer, pagination);
    
    function populateFilters() {
        let medicos = new Set();
        let enfermeiros = new Set();
        let estabelecimentos = new Set();
        
        rows.forEach(row => {
            medicos.add(row.querySelector(".id_medico").textContent.trim());
            enfermeiros.add(row.querySelector(".id_enfermeiro").textContent.trim());
            estabelecimentos.add(row.querySelector(".sigla_estabelecimento").textContent.trim());
        });
        
        function addOptions(selectElement, items) {
            selectElement.innerHTML = '<option value="">Todos</option>';
            items.forEach(item => {
                let option = document.createElement("option");
                option.value = item;
                option.textContent = item;
                selectElement.appendChild(option);
            });
        }
        
        addOptions(filterMedico, medicos);
        addOptions(filterEnfermeiro, enfermeiros);
        addOptions(filterPendencia, estabelecimentos);
    }
    
    function filterTable() {
        const pacienteValue = filterPaciente.value.toLowerCase();
        const medicoValue = filterMedico.value.toLowerCase();
        const enfermeiroValue = filterEnfermeiro.value.toLowerCase();
        const pendenciaValue = filterPendencia.value.toLowerCase();
        
        filteredRows = rows.filter(row => {
            const pacienteText = row.querySelector(".id_paciente").textContent.toLowerCase();
            const medicoText = row.querySelector(".id_medico").textContent.toLowerCase();
            const enfermeiroText = row.querySelector(".id_enfermeiro").textContent.toLowerCase();
            const pendenciaText = row.querySelector(".sigla_estabelecimento").textContent.toLowerCase();
            
            return (pacienteValue === "" || pacienteText.includes(pacienteValue)) &&
                   (medicoValue === "" || medicoText.includes(medicoValue)) &&
                   (enfermeiroValue === "" || enfermeiroText.includes(enfermeiroValue)) &&
                   (pendenciaValue === "" || pendenciaText.includes(pendenciaValue));
        });
        currentPage = 1;
        showPage(currentPage);
    }
    
    function showPage(page) {
        tableBody.innerHTML = "";
        let start = (page - 1) * rowsPerPage;
        let end = start + rowsPerPage;
        let paginatedRows = filteredRows.slice(start, end);
        
        paginatedRows.forEach(row => tableBody.appendChild(row));
        updatePagination();
    }

    function updatePagination() {
        pagination.innerHTML = "";
        let totalPages = Math.ceil(filteredRows.length / rowsPerPage);
        
        let prevDisabled = currentPage === 1 ? "disabled" : "";
        let nextDisabled = currentPage === totalPages ? "disabled" : "";

        pagination.innerHTML += `
            <li class="page-item ${prevDisabled}" id="prevBtn">
                <a class="page-link" href="#"><i class="fas fa-angle-left"></i></a>
            </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            let active = currentPage === i ? "active" : "";
            pagination.innerHTML += `
                <li class="page-item ${active}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>
            `;
        }
        
        pagination.innerHTML += `
            <li class="page-item ${nextDisabled}" id="nextBtn">
                <a class="page-link" href="#"><i class="fas fa-angle-right"></i></a>
            </li>
        `;
    }

    pagination.addEventListener("click", function (event) {
        event.preventDefault();
        let target = event.target;
        if (target.tagName === "A") {
            let newPage = target.dataset.page ? parseInt(target.dataset.page) : null;
            let totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            if (target.closest("#prevBtn") && currentPage > 1) {
                currentPage--;
            } else if (target.closest("#nextBtn") && currentPage < totalPages) {
                currentPage++;
            } else if (newPage) {
                currentPage = newPage;
            }
            showPage(currentPage);
        }
    });
    
    filterPaciente.addEventListener("input", filterTable);
    filterMedico.addEventListener("change", filterTable);
    filterEnfermeiro.addEventListener("change", filterTable);
    filterPendencia.addEventListener("change", filterTable);
    
    populateFilters();
    showPage(currentPage);
});


function editRowPendencia(button) {
    Swal.fire({
        title: 'Aguarde...',
        text: 'Preparando formulário',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const row = button.closest('tr');

    const id_pendencia = row.querySelector(".id_pendencia").textContent.trim();

    window.location.href = `/pendencia/${id_pendencia}/`;

    setTimeout(() => {
        Swal.close();
    }, 6000);     
}

document.addEventListener("DOMContentLoaded", function () {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip-custom";
    document.body.appendChild(tooltip);

    document.querySelectorAll("#tbPendencias tbody tr").forEach(row => {
        row.addEventListener("mouseenter", function (e) {
            // Armazena o title original e remove para evitar conflito com a tooltip nativa
            const tooltipText = row.getAttribute("title");
            row.setAttribute("data-title", tooltipText);
            row.removeAttribute("title"); // Remove o title nativo

            tooltip.innerText = tooltipText;
            tooltip.style.display = "block";
        });

        row.addEventListener("mousemove", function (e) {
            tooltip.style.top = e.pageY + 10 + "px";
            tooltip.style.left = e.pageX + 10 + "px";
        });

        row.addEventListener("mouseleave", function () {
            tooltip.style.display = "none";
            
            // Restaura o title original para acessibilidade ou caso precise ser exibido novamente
            row.setAttribute("title", row.getAttribute("data-title"));
        });
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("tbPendencias");
    const headers = table.querySelectorAll("thead th");
    const tbody = table.querySelector("tbody");

    headers.forEach((header, index) => {
        if (index === headers.length - 1) return; // Ignora a última coluna (Ação)

        let asc = true; // Começa com ordenação crescente
        header.style.cursor = "pointer"; // Altera o cursor para indicar que é clicável

        header.addEventListener("click", function () {
            const rows = Array.from(tbody.querySelectorAll("tr"));

            // Remove ícones de ordenação de outras colunas
            headers.forEach(h => {
                if (h !== header) h.innerHTML = h.innerText;
            });

            rows.sort((rowA, rowB) => {
                const cellA = rowA.children[index].innerText.trim();
                const cellB = rowB.children[index].innerText.trim();

                // Converte para números se aplicável, senão compara strings
                const a = isNaN(cellA) ? cellA.toLowerCase() : parseFloat(cellA);
                const b = isNaN(cellB) ? cellB.toLowerCase() : parseFloat(cellB);

                return asc ? (a > b ? 1 : -1) : (a < b ? 1 : -1);
            });

            // Atualiza a tabela com as novas linhas ordenadas
            tbody.innerHTML = "";
            rows.forEach(row => tbody.appendChild(row));

            // Alterna a direção da ordenação
            asc = !asc;

            // Adiciona ícone de ordenação
            header.innerHTML = `${header.innerText} <i class="fas fa-${asc ? 'sort-up' : 'sort-down'}"></i>`;
        });
    });
});