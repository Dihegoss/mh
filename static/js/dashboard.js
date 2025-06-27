let numBarrasVisiveis = 10;
let dadosOriginaisAltasPorMotivo = null;

//Carrega os estabelecimentos do filtro
const estabelecimentoSelect = document.getElementById("estabelecimento");
estabelecimentoSelect.addEventListener("change", () => {
    const nome =
        estabelecimentoSelect.options[estabelecimentoSelect.selectedIndex].text;
    chart.options.plugins.title.text = `Pendências por Estabelecimento - ${nome}`;
    chart.update();
});

document.addEventListener("DOMContentLoaded", function () {
    // Inicializa datas
    const inputDe = document.getElementById("dt_periodo_de");
    const inputAte = document.getElementById("dt_periodo_ate");

    const hoje = new Date();
    const trintaDiasAntes = new Date();
    trintaDiasAntes.setDate(hoje.getDate() - 90);

    function formatarData(data) {
        return data.toISOString().split('T')[0];
    }

    inputAte.value = formatarData(hoje);
    inputDe.value = formatarData(trintaDiasAntes);

    // Inicializa visibilidade dos painéis
    const selectIndicador = document.getElementById("indicador");
    const divs = [
        'dashboard_altas_por_motivo_de_admissao',
        'dashboard_altas_por_hora',
        'dashboard_longa_permanecia',
        'dashboard_admissoes_e_saidas',
        'dashboard_admissoes',
        'dashboard_altas_dia_da_semana',
        'dashboard_altas_x_transferencia',
        'dashboard_previsoes_de_alta',
        'dashboard_tempos_de_permanencia_mh',
        'dashboard_tempos_de_permanencia',
    ];

    function exibirDivEChamarFuncao(valorSelecionado) {
        divs.forEach(id => {
            const div = document.getElementById(id);
            if (div) {
                div.classList.toggle("d-none", id !== valorSelecionado);
            }
        });

        if (typeof window[valorSelecionado] === 'function') {
            window[valorSelecionado]();
        }
    }
});

function aplicarFiltro(id_profissional = "") {
    // Obtem o valor do indicador selecionado
    const indicador = document.getElementById('indicador').value;

    // Esconde todas as divs de painel
    const paineis = document.querySelectorAll('.painel');
    paineis.forEach(painel => {
        painel.style.display = 'none';
    });

    // Exibe somente a div correspondente ao indicador
    const painelSelecionado = document.getElementById(indicador);
    if (painelSelecionado) {
        painelSelecionado.style.display = 'block';
    }


    const estabelecimentoSelect = document.getElementById("estabelecimento");
    const valorEstabelecimento = estabelecimentoSelect.value;

    const selectIndicador = document.getElementById("indicador");
    const valorIndicador = selectIndicador.value;

    const inputDe = document.getElementById("dt_periodo_de").value;
    const inputAte = document.getElementById("dt_periodo_ate").value;

    let medicoSelect;
    let valorMedico;
    let comanejoSelect;
    let valorComanejo;
    let diaSelect;
    let valorDia;
    let cuidadosPaliativosSelect;
    let cuidadosPaliativosSelecionado

    switch (valorIndicador) {
        case "dashboard_altas_por_motivo_de_admissao":
            dashboard_altas_por_motivo_de_admissao(valorEstabelecimento, inputDe, inputAte);
            break;
        case "dashboard_altas_por_hora":
            dashboard_altas_por_hora(valorEstabelecimento, inputDe, inputAte, id_profissional);
            break;
        case "dashboard_longa_permanecia":
            cuidadosPaliativosSelect = document.getElementById("cuidados_paliativos");
            cuidadosPaliativosSelecionado = cuidadosPaliativosSelect.value;
            comanejoSelect = document.getElementById("comanejo_cirurgico");
            valorComanejo = comanejoSelect.value;            
            dashboard_longa_permanecia(valorEstabelecimento, inputDe, inputAte, cuidadosPaliativosSelecionado, valorComanejo);
            break;
        case "dashboard_admissoes_e_saidas":
            dashboard_admissoes_e_saidas(valorEstabelecimento, inputDe, inputAte);
            break;
        case "dashboard_admissoes":
            medicoSelect = document.getElementById("medico_admissoes");
            valorMedico = medicoSelect ? medicoSelect.value : "";
            comanejoSelect = document.getElementById("comanejo_cirurgico_admissoes");
            valorComanejo = comanejoSelect ? comanejoSelect.value : "";            
            dashboard_admissoes(valorEstabelecimento, inputDe, inputAte, valorMedico, valorComanejo);
            break;
        case "dashboard_altas_dia_da_semana":
            medicoSelect = document.getElementById("profissional_altas_dia_da_semana");
            valorMedico = medicoSelect ? medicoSelect.value : "";
            comanejoSelect = document.getElementById("comanejo_cirurgico_altas_dia_da_semana");
            valorComanejo = comanejoSelect ? comanejoSelect.value : "";
            diaSelect = document.getElementById("dia_da_semana_altas_dia_da_semana");
            valorDia = diaSelect ? diaSelect.value : "";            
            dashboard_altas_dia_da_semana(valorEstabelecimento, inputDe, inputAte, valorMedico, valorComanejo, valorDia);
            break;
        case "dashboard_altas_x_transferencia":
            comanejoSelect = document.getElementById("comanejo_cirurgico_altas_x_transferencia");
            valorComanejo = comanejoSelect ? comanejoSelect.value : "";
            dashboard_altas_x_transferencia(valorEstabelecimento, inputDe, inputAte, valorComanejo);
            break;
        case "dashboard_previsoes_de_alta":
            dashboard_previsoes_de_alta(valorEstabelecimento, inputDe, inputAte);
            break;
        case "dashboard_tempos_de_permanencia_mh":
            medicoSelect = document.getElementById("profissional_tempos_de_permanencia_mh");
            medicoValor = medicoSelect ? medicoSelect.value : "";   
            dashboard_tempos_de_permanencia_mh(valorEstabelecimento, inputDe, inputAte, medicoValor);
            break;
        case "dashboard_tempos_de_permanencia":
            comanejoSelect = document.getElementById("comanejo_tempos_de_permanencia");
            valorComanejo = comanejoSelect ? comanejoSelect.value : "";            
            dashboard_tempos_de_permanencia(valorEstabelecimento, inputDe, inputAte, valorComanejo);
            break;


    }
}

// Botão: Exportar CSV
function exportCSV_AltasPorMotivo() {
    const chart = window.myChartAltasPorMotivo;
    if (!chart) return;

    const rows = [["Motivo", "Quantidade"]];
    chart.data.labels.forEach((label, i) => {
        rows.push([label, chart.data.datasets[0].data[i]]);
    });

    const csvString = rows.map(e => e.join(",")).join("\n");

    // Adiciona BOM para suporte a acentos em Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvString], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "altas_por_motivo.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Botão: Imprimir Gráfico
function printChart(canvas_p) {
    const canvas = document.getElementById(canvas_p);
    const win = window.open();
    win.document.write('<img src="' + canvas.toDataURL() + '"/>');
    win.print();
    win.close();
}





//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                 Altas por Motivo de Internação                 \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
function toggleLoading(canvasId, mostrarLoading) {
    const spinner = document.getElementById("loading-spinner-altas_por_motivo_de_admissao");
    const canvas = document.getElementById(canvasId);

    if (!spinner || !canvas) return;

    spinner.style.display = mostrarLoading ? "block" : "none";
    canvas.style.display = mostrarLoading ? "none" : "block";
}

async function dashboard_altas_por_motivo_de_admissao(estabelecimento, De, Ate) {
    const url = `/dashboard_altas_por_motivo_de_admissao/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}`;

    toggleLoading("canvas_altas_por_motivo_de_admissao", true);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Preencher campos de resumo
        document.getElementById("total_admissoes").value = result.total_admissoes;
        document.getElementById("total_saidas").value = result.total_saidas;
        document.getElementById("tempo_permanencia_hospitalar").value = result.tempo_permanencia_hospitalar;
        document.getElementById("tempo_permanencia_hospitalar_mediana").value = result.tempo_permanencia_hospitalar_mediana;
        document.getElementById("tempo_permanencia_MH").value = result.tempo_permanencia_MH;
        document.getElementById("tempo_permanencia_MH_mediana").value = result.tempo_permanencia_MH_mediana;

        // Armazenar dados completos
        dadosOriginaisAltasPorMotivo = {
            labels: result.labels,
            data: result.data
        };

        // Renderizar o gráfico com a quantidade inicial
        renderizarAltasPorMotivoChart(numBarrasVisiveis);

    } catch (erro) {
        console.error("Erro ao buscar dados do gráfico:", erro);
        alert("Não foi possível carregar os dados. Tente novamente mais tarde.");
    } finally {
        toggleLoading("canvas_altas_por_motivo_de_admissao", false);
    }
}

function renderizarAltasPorMotivoChart(qtd) {
    if (!dadosOriginaisAltasPorMotivo) return;

    const canvas = document.getElementById("canvas_altas_por_motivo_de_admissao");
    const ctx = canvas.getContext("2d");

    const zipped = dadosOriginaisAltasPorMotivo.labels.map((label, i) => ({
        label,
        value: dadosOriginaisAltasPorMotivo.data[i]
    })).sort((a, b) => b.value - a.value);

    const dadosLimitados = zipped.slice(0, qtd);
    const labels = dadosLimitados.map(item => item.label);
    const data = dadosLimitados.map(item => item.value);

    const paddingExtra = 60;
    const alturaPorBarra = qtd > 40 ? 30 : qtd > 20 ? 35 : 40;
    canvas.height = 500; //(qtd * alturaPorBarra) + paddingExtra;

    if (window.myChartAltasPorMotivo) {
        window.myChartAltasPorMotivo.data.labels = labels;
        window.myChartAltasPorMotivo.data.datasets[0].data = data;
        canvas.height = 500; //(qtd * alturaPorBarra) + paddingExtra; // Ainda é necessário ajustar o canvas manualmente
        window.myChartAltasPorMotivo.update();
    } else {
        window.myChartAltasPorMotivo = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Quantidade de altas",
                    data,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'right',
                        color: '#000',
                        font: { weight: 'bold' },
                        clip: true,
                        formatter: function (value, context) {
                            const total = dadosOriginaisAltasPorMotivo.data.reduce((sum, val) => sum + val, 0);
                            const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                            return `${value} (${percentage}%)`;
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed.x;
                                const total = dadosOriginaisAltasPorMotivo.data.reduce((sum, val) => sum + val, 0);
                                const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                                return `${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...dadosOriginaisAltasPorMotivo.data) * 1.1, // aumenta 10% além do maior valor
                        title: {
                            display: true,
                            text: 'Quantidade de dias',
                            font: {
                                size: 14,
                                //weight: 'bold'
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'CID da Internação',
                            font: {
                                size: 14,
                                //weight: 'bold'
                            }
                        }
                    }
                },
                animation: {
                    duration: 300
                }
            },
            plugins: [ChartDataLabels],
        });
    }


}

function zoomInAltasPorMotivoAdmissao() {
    const max = dadosOriginaisAltasPorMotivo?.labels.length || 10;
    if (numBarrasVisiveis < max) {
        numBarrasVisiveis++;
        renderizarAltasPorMotivoChart(numBarrasVisiveis);
    }
}

function zoomOutAltasPorMotivoAdmissao() {
    const max = dadosOriginaisAltasPorMotivo?.labels.length || 10;
    if (numBarrasVisiveis > 1) {
        numBarrasVisiveis--;
        renderizarAltasPorMotivoChart(numBarrasVisiveis);
    }
}

function resetZoomAltasPorMotivoAdmissao() {
    numBarrasVisiveis = 10; // ou qualquer número padrão
    renderizarAltasPorMotivoChart(numBarrasVisiveis);
}

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                 Altas por Motivo de Internação                 \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\




//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                         Altas por Hora                         \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
function dashboard_altas_por_hora(estabelecimento, De, Ate, profissional = "") {
    const url = `/dashboard_altas_por_hora/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}&profissional=${profissional}`;

    // Mostrar o spinner
    document.getElementById("loading-spinner-altas_por_hora").style.display = "block";

    fetch(url)
        .then((response) => response.json())
        .then((result) => {
            const ctx = document.getElementById("canvas_altas_por_hora").getContext("2d");

            if (window.myChartAltasPorHora) {
                window.myChartAltasPorHora.destroy();
            }

            window.myChartAltasPorHora = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: result.labels,
                    datasets: [{
                        label: "Altas por Hora",
                        data: result.data,
                        backgroundColor: "rgba(75, 192, 192, 0.6)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: false,
                            text: "Altas por Hora",
                            font: {
                                size: 18,
                                weight: "bold"
                            },
                            padding: {
                                top: 10,
                                bottom: 30
                            }
                        },
                        legend: {
                            display: false
                        },
                        annotation: {
                            annotations: {
                                faixaManha: {
                                    type: 'box',
                                    xMin: 5.5,
                                    xMax: 9.5,
                                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                                    borderWidth: 0
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Quantidade de Altas"
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: "Hora do Dia"
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels], // Ativa o plugin de exibição de rótulos
            });

            // Preenche os campos da lateral
            document.getElementById("total_ate_10hrs").value = result.total_ate_10h;
            document.getElementById("percentual_ate_10hrs").value = `${result.percentual_ate_10h}%`;
            document.getElementById("percentual_ate_10hrs_6_meses").value = `${result.percentual_ate_10h_ultimo_semestre}%`;

            // Esconder o spinner
            document.getElementById("loading-spinner-altas_por_hora").style.display = "none";
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const selectProfissional = document.getElementById('profissional');

    selectProfissional.addEventListener('change', function () {
        const id_profissional = this.value;
        aplicarFiltro(id_profissional);
    });
});
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                         Altas por Hora                         \\\\\\
//////                               FIM                              \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\



//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                       Longa Permanência                        \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
function dashboard_longa_permanecia(estabelecimento, De, Ate, cuidados_paliativos, comanejo_cirurgico) {
    const url = `/dashboard_longa_permanecia/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}&cuidados_paliativos=${cuidados_paliativos}&comanejo_cirurgico=${comanejo_cirurgico}`;
    document.getElementById("loading-spinner-longa_permanecia").style.display = "block";

    fetch(url)
        .then((response) => response.json())
        .then((result) => {
            // Gráfico principal (longa permanência)
            const ctx = document.getElementById("canvas_longa_permanecia").getContext("2d");
            if (window.myChartLongaPermanencia) window.myChartLongaPermanencia.destroy();
            const total = result.data.reduce((acc, val) => acc + val, 0);
            const percentuais = result.data.map(val => total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "0%");
            window.myChartLongaPermanencia = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: result.labels,
                    datasets: [{
                        label: "Longa Permanência",
                        data: result.data,
                        backgroundColor: "rgba(75, 192, 192, 0.6)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: "y",
                    responsive: true,
                    layout: {
                        padding: {
                            right: 80  // Ajuste conforme necessário
                        }
                    },
                    plugins: {
                        datalabels: {
                            anchor: 'end',
                            align: 'right',
                            formatter: function (value) {
                                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                                return `${value} (${percent}%)`;
                            },
                            color: '#000',
                            font: {
                                weight: 'bold'
                            }
                        },
                        title: { display: false },
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: "Mês/Ano" } },
                        x: { title: { display: true, text: "Quantidade de Altas" } }
                    }
                },
                plugins: [ChartDataLabels]
            });

            // Tabela de atendimentos (ID e duração)
            const tabela = document.getElementById("tabela_atendimentos_longa_permanencia");
            tabela.innerHTML = "";
            result.atendimentos.forEach((at) => {
                const row = document.createElement("tr");
                row.setAttribute("data-id", at.id); // Adicionando o 'data-id' à linha
                row.setAttribute("data-nr-atendimento", at.nr_atendimento_mv); // Adicionando o 'data-nr-atendimento' à linha
                row.innerHTML = `
                    <td style="display:none;">${at.id}</td>  <!-- Coluna ID oculta -->
                    <td>${at.nr_atendimento_mv}</td>
                    <td>${at.duracao_dias} dias</td>
                `;  // Populando as células
                tabela.appendChild(row); // Adicionando a linha à tabela
            });

            // Gráfico de desfecho (pizza)
            const ctxDesfecho = document.getElementById("grafico_desfecho_longa_permanencia").getContext("2d");
            if (window.myChartDesfechoLongaPermanencia) window.myChartDesfechoLongaPermanencia.destroy();
            window.myChartDesfechoLongaPermanencia = new Chart(ctxDesfecho, {
                type: "pie",
                data: {
                    labels: result.labels_desfechos,
                    datasets: [{
                        data: result.data_desfechos,
                        backgroundColor: ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71"],
                        borderColor: "#fff",
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom" },
                        title: { display: true, text: "Desfecho da Longa Permanência" },
                        datalabels: {
                            formatter: (value, ctx) => {
                                let total = ctx.chart._metasets[0].total;
                                let percentage = (value / total * 100).toFixed(1) + "%";
                                return percentage;
                            },
                            color: '#fff',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });


            // Gráfico de patologias (pizza) - top 3
            const ctxPatologia = document.getElementById("grafico_patologia_longa_permanencia").getContext("2d");
            if (window.myChartPatologiaLongaPermanencia) window.myChartPatologiaLongaPermanencia.destroy();
            window.myChartPatologiaLongaPermanencia = new Chart(ctxPatologia, {
                type: "pie",
                data: {
                    labels: result.labels_patologias,
                    datasets: [{
                        data: result.data_patologias,
                        backgroundColor: ["#8e44ad", "#27ae60", "#e67e22", "#2980b9", "#f39c12"],
                        borderColor: "#fff",
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom" },
                        title: { display: true, text: "Patologias" },
                        datalabels: {
                            formatter: (value, ctx) => {
                                let total = ctx.chart._metasets[0].total;
                                let percentage = (value / total * 100).toFixed(1) + "%";
                                return percentage;
                            },
                            color: '#fff',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });

            document.getElementById("loading-spinner-longa_permanecia").style.display = "none";
        });
}

document.getElementById("tabela_atendimentos_longa_permanencia").addEventListener("click", function (e) {
    const row = e.target.closest("tr");
    if (row) {
        const id = row.getAttribute("data-id");  // Captura o ID da linha
        window.open(`/pendencia/${id}/`, '_blank');  // Abre o link em nova aba
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const estabelecimentoSelect = document.getElementById("estabelecimento");
    const valorEstabelecimento = estabelecimentoSelect.value;

    const inputDe = document.getElementById("dt_periodo_de").value;
    const inputAte = document.getElementById("dt_periodo_ate").value;

    const cuidadosPaliativosSelect = document.getElementById("cuidados_paliativos");
    let cuidadosPaliativosSelecionado = cuidadosPaliativosSelect.value;

    const comanejoCirurgicoSelect = document.getElementById("comanejo_cirurgico");
    let comanejoCirurgicoSelecionado = comanejoCirurgicoSelect.value;

    cuidadosPaliativosSelect.addEventListener("change", function () {
        cuidadosPaliativosSelecionado = this.value;
        dashboard_longa_permanecia(valorEstabelecimento, inputDe, inputAte, cuidadosPaliativosSelecionado, comanejoCirurgicoSelecionado);
    });

    comanejoCirurgicoSelect.addEventListener("change", function () {
        comanejoCirurgicoSelecionado = this.value;
        dashboard_longa_permanecia(valorEstabelecimento, inputDe, inputAte, cuidadosPaliativosSelecionado, comanejoCirurgicoSelecionado);
    });
});

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                       Longa Permanência                        \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\



//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                       Admissões e Saídas                       \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
let allMunicipiosLabels = [];
let allMunicipiosValues = [];
let currentMunicipiosLimit = 10;

function renderMunicipioChart() {
    const ctxMunicipio = document.getElementById("canvas_admissoes_e_saidas_municipio").getContext("2d");
    if (window.myChartMunicipios) window.myChartMunicipios.destroy();

    const limitedLabels = allMunicipiosLabels.slice(0, currentMunicipiosLimit);
    const limitedValues = allMunicipiosValues.slice(0, currentMunicipiosLimit);
    const totalMunicipios = limitedValues.reduce((acc, val) => acc + val, 0);

    window.myChartMunicipios = new Chart(ctxMunicipio, {
        type: "bar",
        data: {
            labels: limitedLabels,
            datasets: [{
                label: "Total de Atendimentos",
                data: limitedValues,
                backgroundColor: "rgba(54, 162, 235, 0.7)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Total de Atendimentos por Município"
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed.x;
                            const percent = ((value / totalMunicipios) * 100).toFixed(1);
                            return `${value} (${percent}%)`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: function (value) {
                        const percent = ((value / totalMunicipios) * 100).toFixed(1);
                        return `${value} (${percent}%)`;
                    },
                    color: '#000',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Quantidade de Atendimentos"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Município"
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function dashboard_admissoes_e_saidas(estabelecimento, De, Ate) {
    const url = `/dashboard_admissoes_e_saidas/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}`;
    document.getElementById("loading-spinner-admissoes_e_saidas").style.display = "block";

    fetch(url)
        .then((response) => response.json())
        .then((result) => {
            // Gráfico principal (linha: admissões e saídas)
            const ctx = document.getElementById("canvas_admissoes_e_saidas").getContext("2d");
            if (window.myChartAdmissoesSaidas) window.myChartAdmissoesSaidas.destroy();

            window.myChartAdmissoesSaidas = new Chart(ctx, {
                type: "line",
                data: {
                    labels: result.labels,
                    datasets: [
                        {
                            label: "Admissões",
                            data: result.admissoes,
                            borderColor: "rgba(75, 192, 192, 1)",
                            backgroundColor: "rgba(75, 192, 192, 0.2)",
                            tension: 0.3,
                            fill: false
                        },
                        {
                            label: "Saídas",
                            data: result.altas,
                            borderColor: "rgba(255, 99, 132, 1)",
                            backgroundColor: "rgba(255, 99, 132, 0.2)",
                            tension: 0.3,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    layout: {
                        padding: {
                            left: 20,
                            right: 20
                        }
                    },
                    plugins: {
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            color: '#000',
                            font: {
                                weight: 'bold'
                            }
                        },
                        title: { display: false },
                        legend: { display: true }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: "Quantidade" }
                        },
                        x: {
                            title: { display: true, text: "Mês/Ano" }
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                },
                plugins: [ChartDataLabels]
            });

            const ctxMunicipio = document.getElementById("canvas_admissoes_e_saidas_municipio").getContext("2d");
            if (window.myChartMunicipios) window.myChartMunicipios.destroy();

            const totalMunicipios = result.municipios_values.reduce((acc, val) => acc + val, 0);

            window.myChartMunicipios = new Chart(ctxMunicipio, {
                type: "bar",
                data: {
                    labels: result.municipios_labels,
                    datasets: [{
                        label: "Total de Atendimentos",
                        data: result.municipios_values,
                        backgroundColor: "rgba(54, 162, 235, 0.7)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: "y", // horizontal bar chart
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: "Total de Atendimentos por Município"
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const value = context.parsed.x;
                                    const percent = ((value / totalMunicipios) * 100).toFixed(1);
                                    return `${value} (${percent}%)`;
                                }
                            }
                        },
                        datalabels: {
                            anchor: 'end',
                            align: 'end',
                            formatter: function (value) {
                                const percent = ((value / totalMunicipios) * 100).toFixed(1);
                                return `${value} (${percent}%)`;
                            },
                            color: '#000',
                            font: {
                                weight: 'bold'
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Quantidade de Atendimentos"
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: "Município"
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
            allMunicipiosLabels = result.municipios_labels;
            allMunicipiosValues = result.municipios_values;
            currentMunicipiosLimit = 10;
            renderMunicipioChart();             

            // Gráfico de barras - Origem do paciente
            const ctxOrigem = document.getElementById("canvas_admissoes_e_saidas_admissoes").getContext("2d");
            if (window.myChartOrigem) window.myChartOrigem.destroy();
            window.myChartOrigem = new Chart(ctxOrigem, {
                type: "bar",
                data: {
                    labels: result.origem_labels,
                    datasets: [{
                        label: "% por Origem",
                        data: result.origem_percentuais,
                        absoluteData: result.origem_absolutos,
                        backgroundColor: "rgba(54, 162, 235, 0.6)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {
                        datalabels: {
                            anchor: 'end',
                            align: 'right',
                            color: '#000',
                            font: { weight: 'bold' },
                            formatter: (val, context) => {
                                const total = context.chart.data.datasets[0].absoluteData?.[context.dataIndex] || 0;
                                return `${total} (${val}%)`;
                            }
                        },
                        title: { display: true, text: "Origem do Paciente" },
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: "%" }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });

            // Gráfico de barras - Motivo de saída
            const ctxSaidas = document.getElementById("canvas_admissoes_e_saidas_saidas").getContext("2d");
            if (window.myChartSaidas) window.myChartSaidas.destroy();
            window.myChartSaidas = new Chart(ctxSaidas, {
                type: "bar",
                data: {
                    labels: result.motivo_labels,
                    datasets: [{
                        label: "% por Motivo de Saída",
                        data: result.motivo_percentuais,
                        absoluteData: result.motivo_absolutos,
                        backgroundColor: "rgba(255, 159, 64, 0.6)",
                        borderColor: "rgba(255, 159, 64, 1)",
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {
                        datalabels: {
                            anchor: 'end',
                            align: 'right',
                            color: '#000',
                            font: { weight: 'bold' },
                            formatter: (val, context) => {
                                const total = context.chart.data.datasets[0].absoluteData?.[context.dataIndex] || 0;
                                return `${total} (${val}%)`;
                            }
                        },
                        title: { display: true, text: "Motivo de Saída" },
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: "%" }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });

            document.getElementById("loading-spinner-admissoes_e_saidas").style.display = "none";
        });
}

function zoomInAdmissoesSaidasMunicipio() {
    if (currentMunicipiosLimit < allMunicipiosLabels.length) {
        currentMunicipiosLimit += 1;
        renderMunicipioChart();
    }
}

function zoomOutAdmissoesSaidasMunicipio() {
    if (currentMunicipiosLimit > 3) {
        currentMunicipiosLimit -= 1;
        renderMunicipioChart();
    }
}

function resetZoomAdmissoesSaidasMunicipio() {
    currentMunicipiosLimit = 10;
    renderMunicipioChart();
}

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                       Admissões e Saídas                       \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\


//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                           Admissões                            \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
function dashboard_admissoes(estabelecimento, De, Ate, medico, comanejo) {
    const url = `/dashboard_admissoes/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}&medico=${medico}&comanejo=${comanejo}`;
    document.getElementById("loading-spinner-admissoes").style.display = "block";

    fetch(url)
        .then((response) => response.json())
        .then((result) => {
            // Gráfico principal (linha - admissões por mês)
            const ctx = document.getElementById("canvas_admissoes").getContext("2d");
            if (window.myChartAdmissoes) window.myChartAdmissoes.destroy();

            window.myChartAdmissoes = new Chart(ctx, {
                type: "line",
                data: {
                    labels: result.labels,
                    datasets: [{
                        label: "Admissões",
                        data: result.data,
                        fill: false,
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    layout: {
                        padding: { top: 20 }
                    },
                    plugins: {
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            color: '#000',
                            font: { weight: 'bold' }
                        },
                        title: { display: false },
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: "Quantidade de Admissões" }
                        },
                        x: {
                            title: { display: true, text: "Mês/Ano" }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });

            // Gráfico horizontal de motivos de admissão
            const canvasMotivo = document.getElementById("canvas_admissoes_motivo");
            const ctxMotivo = canvasMotivo.getContext("2d");

            if (window.myChartMotivosAdmissao) window.myChartMotivosAdmissao.destroy();

            // Ajuste dinâmico da altura com base no número de motivos
            const motivosCount = result.motivo_labels.length;
            const alturaMinimaPorMotivo = 50; // pixels por label
            canvasMotivo.height = motivosCount * alturaMinimaPorMotivo;

            window.myChartMotivosAdmissao = new Chart(ctxMotivo, {
                type: "bar",
                data: {
                    labels: result.motivo_labels,
                    datasets: [{
                        label: "% por motivo",
                        data: result.motivo_data,
                        absoluteData: result.motivo_absolutos,
                        backgroundColor: "rgba(54, 162, 235, 0.6)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false, // Permite o uso da altura dinâmica
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: "Porcentagem (%)" }
                        },
                        y: {
                            title: { display: false }
                        }
                    },
                    plugins: {
                        datalabels: {
                            anchor: 'end',
                            align: 'right',
                            color: '#000',
                            font: { weight: 'bold' },
                            formatter: (val, context) => {
                                const absol = context.dataset.absoluteData?.[context.dataIndex] || 0;
                                return `${absol} (${val}%)`;
                            }
                        },
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: context => {
                                    const absol = context.dataset.absoluteData?.[context.dataIndex] || 0;
                                    return `${absol} (${context.raw}%)`;
                                }
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });

            document.getElementById("loading-spinner-admissoes").style.display = "none";
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const medicoSelect = document.getElementById("medico_admissoes");
    const comanejoSelect = document.getElementById("comanejo_cirurgico_admissoes");

    function handleFiltroChange() {
        const estabelecimentoSelect = document.getElementById("estabelecimento");
        const inputDe = document.getElementById("dt_periodo_de");
        const inputAte = document.getElementById("dt_periodo_ate");

        const valorEstabelecimento = estabelecimentoSelect ? estabelecimentoSelect.value : "";
        const valorDe = inputDe ? inputDe.value : "";
        const valorAte = inputAte ? inputAte.value : "";
        const valorMedico = medicoSelect ? medicoSelect.value : "";
        const valorComanejo = comanejoSelect ? comanejoSelect.value : "";

        dashboard_admissoes(valorEstabelecimento, valorDe, valorAte, valorMedico, valorComanejo);
    }

    if (medicoSelect) {
        medicoSelect.addEventListener("change", handleFiltroChange);
    }

    if (comanejoSelect) {
        comanejoSelect.addEventListener("change", handleFiltroChange);
    }
});

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                           Admissões                            \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                     Altas Dias da Semana                       \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
function dashboard_altas_dia_da_semana(estabelecimento, De, Ate, medico, comanejo, diaSemana) {
    const url = `/dashboard_altas_dia_da_semana/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}&medico=${medico}&comanejo=${comanejo}&dia_semana=${diaSemana}`;
    document.getElementById("loading-spinner-admissoes").style.display = "block";

    fetch(url)
        .then((response) => response.json())
        .then((result) => {
            const ctx = document.getElementById("canvas_altas_dia_da_semana").getContext("2d");
            if (window.myChartAltasDiasDaSemana) window.myChartAltasDiasDaSemana.destroy();

            const sabadoIndex = result.labels.indexOf("Sábado");
            const domingoIndex = result.labels.indexOf("Domingo");

            window.myChartAltasDiasDaSemana = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: result.labels,
                    datasets: [{
                        label: 'Altas',
                        data: result.dados,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        },
                        annotation: {
                            annotations: {
                                faixaFimDeSemana: {
                                    type: 'box',
                                    xMin: sabadoIndex - 0.5,
                                    xMax: domingoIndex + 0.5,
                                    backgroundColor: 'rgba(255, 206, 86, 0.15)',
                                    borderWidth: 0
                                }
                            }
                        },
                        datalabels: {
                            color: '#000',
                            anchor: 'end',
                            align: 'start',
                            formatter: function (value, context) {
                                const total = result.total_altas;
                                const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                return `${value} (${percent}%)`;
                            },
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: [
                    Chart.registry.getPlugin('annotation'),
                    ChartDataLabels
                ]
            });

            document.getElementById("altas_no_fim_de_semana").value = result.altas_fim_de_semana;
            document.getElementById("percentual_altas_no_fim_de_semana").value = result.percentual_fim_de_semana + "%";
            document.getElementById("percentual_acumulado_ultimo_trimestre").value = result.percentual_trim + "%";

            document.getElementById("loading-spinner-admissoes").style.display = "none";
        })
        .catch((error) => {
            console.error("Erro ao carregar dados:", error);
            document.getElementById("loading-spinner-admissoes").style.display = "none";
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const medicoSelect = document.getElementById("profissional_altas_dia_da_semana");
    const comanejoSelect = document.getElementById("comanejo_cirurgico_altas_dia_da_semana");
    const diaSelect = document.getElementById("dia_da_semana_altas_dia_da_semana");

    function handleFiltroChange() {
        const estabelecimentoSelect = document.getElementById("estabelecimento");
        const inputDe = document.getElementById("dt_periodo_de");
        const inputAte = document.getElementById("dt_periodo_ate");

        const valorEstabelecimento = estabelecimentoSelect ? estabelecimentoSelect.value : "";
        const valorDe = inputDe ? inputDe.value : "";
        const valorAte = inputAte ? inputAte.value : "";
        const valorMedico = medicoSelect ? medicoSelect.value : "";
        const valorComanejo = comanejoSelect ? comanejoSelect.value : "";
        const valorDia = diaSelect ? diaSelect.value : "";

        dashboard_altas_dia_da_semana(valorEstabelecimento, valorDe, valorAte, valorMedico, valorComanejo, valorDia);
    }

    if (medicoSelect) {
        medicoSelect.addEventListener("change", handleFiltroChange);
    }

    if (comanejoSelect) {
        comanejoSelect.addEventListener("change", handleFiltroChange);
    }

    if (diaSelect) {
        diaSelect.addEventListener("change", handleFiltroChange);
    }
});

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                     Altas Dias da Semana                       \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                      Altas x Transferencia                     \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
function dashboard_altas_x_transferencia(estabelecimento, De, Ate, comanejo) {
    const url = `/dashboard_altas_x_transferencia/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}&comanejo=${comanejo}`;
    document.getElementById("loading-spinner-admissoes").style.display = "block";

    fetch(url)
        .then(response => response.json())
        .then(result => {
            const ctx = document.getElementById("canvas_altas_x_transferencia").getContext("2d");
            if (window.myChartAltas_x_Transferencia) window.myChartAltas_x_Transferencia.destroy();

            // Calcular total por mês para o percentual
            const totaisPorMes = result.saidas.map((_, i) =>
                result.saidas[i] + result.transferencia_interna[i] + result.transferencia_externa[i]
            );

            window.myChartAltas_x_Transferencia = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: result.labels,
                    datasets: [
                        {
                            label: "Saídas",
                            data: result.saidas,
                            backgroundColor: "#4CAF50", // verde
                            stack: "Stack 0",
                            datalabels: {
                                formatter: function (value, context) {
                                    const total = totaisPorMes[context.dataIndex];
                                    const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${value} (${percent}%)`;
                                }
                            }
                        },
                        {
                            label: "Transferência interna",
                            data: result.transferencia_interna,
                            backgroundColor: "#FFC107", // amarelo
                            stack: "Stack 1",
                            datalabels: {
                                formatter: function (value, context) {
                                    const total = totaisPorMes[context.dataIndex];
                                    const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${value} (${percent}%)`;
                                }
                            }
                        },
                        {
                            label: "Transferência externa",
                            data: result.transferencia_externa,
                            backgroundColor: "#FF5722", // laranja
                            stack: "Stack 1", // mesma stack da interna
                            datalabels: {
                                formatter: function (value, context) {
                                    const total = totaisPorMes[context.dataIndex];
                                    const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${value} (${percent}%)`;
                                }
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        datalabels: {
                            color: "#000",
                            anchor: 'end',
                            align: 'start',
                            font: {
                                weight: 'bold',
                                size: 11
                            }
                        },
                        legend: {
                            position: "top",
                        },
                        title: {
                            display: true,
                            text: "Altas por Mês (Saídas vs Transferências)"
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            ticks: {
                                        padding: 20
                                    }                            
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });

            document.getElementById("loading-spinner-admissoes").style.display = "none";
        })
        .catch(error => {
            console.error('Erro ao carregar dados do gráfico:', error);
            document.getElementById("loading-spinner-admissoes").style.display = "none";
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const comanejoSelect = document.getElementById("comanejo_cirurgico_altas_x_transferencia");

    function handleFiltroChange() {
        const estabelecimentoSelect = document.getElementById("estabelecimento");
        const inputDe = document.getElementById("dt_periodo_de");
        const inputAte = document.getElementById("dt_periodo_ate");

        const valorEstabelecimento = estabelecimentoSelect ? estabelecimentoSelect.value : "";
        const valorDe = inputDe ? inputDe.value : "";
        const valorAte = inputAte ? inputAte.value : "";
        const valorComanejo = comanejoSelect ? comanejoSelect.value : "";

        dashboard_altas_x_transferencia(valorEstabelecimento, valorDe, valorAte, valorComanejo);
    }

    if (comanejoSelect) {
        comanejoSelect.addEventListener("change", handleFiltroChange);
    }
});
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                      Altas x Transferencia                     \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                        Previsão de Alta                        \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
let tabelaPrevisoes = null;

function dashboard_previsoes_de_alta(estabelecimento, De, Ate) {
    const url = `/dashboard_previsoes_de_alta/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}`;

    fetch(url)
        .then((response) => response.json())
        .then((result) => {
            if (!$.fn.DataTable.isDataTable("#tbPrevisoesDeAlta")) {
                tabelaPrevisoes = $("#tbPrevisoesDeAlta").DataTable({
                    ordering: true,
                    searching: false,
                    paging: false,
                    info: false,
                    order: [[2, "desc"]], // ordena pela 3ª coluna (Precisão) desc
                    language: {
                        url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json",
                        emptyTable: "Nenhum dado disponível"
                    },
                    columns: [
                        { orderable: true }, // Médico
                        { orderable: true }, // % Altas com Previsão
                        { orderable: true }  // Precisão
                    ]
                });
            } else {
                tabelaPrevisoes.clear();
            }

            result.medicos.forEach(item => {
                tabelaPrevisoes.row.add([
                    "Dr(a) " + item.medico,
                    item.altas_com_previsao + "%",
                    item.precisao_alta + "%"
                ]);
            });

            tabelaPrevisoes.draw();

            document.getElementById("periodo_altas_com_previsao").value = result.media_altas_com_previsao + "%";
            document.getElementById("periodo_precisao").value = result.media_precisao_alta + "%";
            document.getElementById("acumulado_ano_altas_com_previsao").value = result.acumulado_ano_altas_com_previsao + "%";
            document.getElementById("acumulado_ano_precisao").value = result.acumulado_ano_precisao + "%";

            document.getElementById('dashboard_previsoes_de_alta').style.display = 'block';
        })
        .catch((error) => {
            console.error("Erro ao buscar previsões de alta:", error);
        });
}
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                        Previsão de Alta                        \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                   Tempos de Permanência MH                     \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
function dashboard_tempos_de_permanencia_mh(estabelecimento, De, Ate, medico) {
    const url = `/dashboard_tempos_de_permanencia_mh/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}&medico=${medico}`;
    document.getElementById("loading-spinner-admissoes").style.display = "block";

    fetch(url)
        .then((response) => response.json())
        .then((result) => {
            const ctx = document.getElementById("canvas_tempos_de_permanencia_mh").getContext("2d");
            if (window.myChartTemposDePermanenciaMH) {
                window.myChartTemposDePermanenciaMH.destroy();
            }

            window.myChartTemposDePermanenciaMH = new Chart(ctx, {
                type: "line",
                data: {
                    labels: result.labels,
                    datasets: [
                        {
                            label: "Média",
                            data: result.media,
                            borderColor: "blue",
                            backgroundColor: "blue",
                            tension: 0.3
                        },
                        {
                            label: "Mediana",
                            data: result.mediana,
                            borderColor: "green",
                            backgroundColor: "green",
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const dataset = context.dataset.data;
                                    const total = dataset.reduce((a, b) => a + b, 0);
                                    const percent = ((value / total) * 100).toFixed(1);
                                    return `${context.dataset.label}: ${value} dias (${percent}%)`;
                                }
                            }
                        },
                        datalabels: {
                            display: function(context) {
                                return context.dataIndex % 2 === 0; // mostra apenas em índices pares
                            },
                            formatter: function(value, context) {
                                const dataset = context.chart.data.datasets[context.datasetIndex].data;
                                const total = dataset.reduce((a, b) => a + b, 0);
                                const percent = ((value / total) * 100).toFixed(1);
                                return `${value} (${percent}%)`;
                            },
                            color: "black",
                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                            borderRadius: 4,
                            padding: 2,
                            anchor: "center",
                            align: function(context) {
                                return context.datasetIndex === 0 ? "top" : "bottom";
                            },
                            font: {
                                weight: "bold",
                                size: 9
                            },
                            clip: true,
                            clamp: true
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });

            document.getElementById("loading-spinner-admissoes").style.display = "none";
        });
}


document.addEventListener("DOMContentLoaded", function () {
    const medicoSelect = document.getElementById("profissional_tempos_de_permanencia_mh");

    function handleFiltroChange() {
        const estabelecimentoSelect = document.getElementById("estabelecimento");
        const inputDe = document.getElementById("dt_periodo_de");
        const inputAte = document.getElementById("dt_periodo_ate");

        const valorEstabelecimento = estabelecimentoSelect ? estabelecimentoSelect.value : "";
        const valorDe = inputDe ? inputDe.value : "";
        const valorAte = inputAte ? inputAte.value : "";
        const medicoValor = medicoSelect ? medicoSelect.value : "";

        dashboard_tempos_de_permanencia_mh(valorEstabelecimento, valorDe, valorAte, medicoValor);
    }

    if (medicoSelect) {
        medicoSelect.addEventListener("change", handleFiltroChange);
    }
});
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                   Tempos de Permanência MH                     \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\

//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                             INÍCIO                             \\\\\\
//////                      Tempos de Permanência                     \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
function dashboard_tempos_de_permanencia(estabelecimento, De, Ate, comanejo) {
    const url = `/dashboard_tempos_de_permanencia/?estabelecimento=${encodeURIComponent(estabelecimento)}&de=${De}&ate=${Ate}&comanejo=${comanejo}`;
    document.getElementById("loading-spinner-admissoes").style.display = "block";

    fetch(url)
        .then((response) => response.json())
        .then((result) => {
            const ctx = document.getElementById("canvas_tempos_de_permanencia").getContext("2d");
            if (window.myChartTemposDePermanencia) {
                window.myChartTemposDePermanencia.destroy();
            }

            window.myChartTemposDePermanencia = new Chart(ctx, {
                type: "line",
                data: {
                    labels: result.labels,
                    datasets: [
                        {
                            label: "Média",
                            data: result.media,
                            borderColor: "blue",
                            backgroundColor: "blue",
                            tension: 0.3
                        },
                        {
                            label: "Mediana",
                            data: result.mediana,
                            borderColor: "green",
                            backgroundColor: "green",
                            tension: 0.3
                        },
                        {
                            label: "Charlson Médio",
                            data: result.charlson_media,
                            borderColor: "red",
                            backgroundColor: "red",
                            borderDash: [5, 5],
                            tension: 0.3
                        },
                        {
                            label: "Charlson Mediano",
                            data: result.charlson_mediana,
                            borderColor: "orange",
                            backgroundColor: "orange",
                            borderDash: [5, 5],
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const label = context.dataset.label;
                                    const dataset = context.dataset.data;
                                    const total = dataset.reduce((a, b) => a + b, 0);
                                    const percent = total ? ((value / total) * 100).toFixed(1) : "0.0";
                                    const unidade = label.includes("Charlson") ? "pontos" : "dias";
                                    return `${label}: ${value} ${unidade} (${percent}%)`;
                                }
                            }
                        },
                        datalabels: {
                            formatter: function(value, context) {
                                const dataset = context.chart.data.datasets[context.datasetIndex].data;
                                const total = dataset.reduce((a, b) => a + b, 0);
                                const percent = total ? ((value / total) * 100).toFixed(1) : "0.0";
                                return `${value} (${percent}%)`;
                            },
                            color: "black",
                            anchor: "end",
                            align: "top",
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
            // Atualiza os campos do resumo da sessão
            document.getElementById("admitidos_no_periodo").value = result.admitidos_no_periodo || 0;
            document.getElementById("admitidos_em_loga_permanencia").value = result.admitidos_em_longa_permanencia || 0;
            document.getElementById("media_geral_tempo_permanencia").value = result.media_geral_tempo_permanencia || 0;
            document.getElementById("media_pacientes_loga_permanencia").value = result.media_pacientes_longa_permanencia || 0;
            document.getElementById("media_pacientes_nao_longa_permanencia").value = result.media_pacientes_nao_longa_permanencia || 0;

            document.getElementById("loading-spinner-admissoes").style.display = "none";
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const comanejoSelect = document.getElementById("comanejo_tempos_de_permanencia");

    function handleFiltroChange() {
        const estabelecimentoSelect = document.getElementById("estabelecimento");
        const inputDe = document.getElementById("dt_periodo_de");
        const inputAte = document.getElementById("dt_periodo_ate");

        const valorEstabelecimento = estabelecimentoSelect ? estabelecimentoSelect.value : "";
        const valorDe = inputDe ? inputDe.value : "";
        const valorAte = inputAte ? inputAte.value : "";
        const comanejoValor = comanejoSelect ? comanejoSelect.value : "";

        dashboard_tempos_de_permanencia(valorEstabelecimento, valorDe, valorAte, comanejoValor);
    }

    if (comanejoSelect) {
        comanejoSelect.addEventListener("change", handleFiltroChange);
    }
});
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\
//////                      Tempos de Permanência                     \\\\\\
//////                              FIM                               \\\\\\
//////----------------------------------------------------------------\\\\\\
//////----------------------------------------------------------------\\\\\\