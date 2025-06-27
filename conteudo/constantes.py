c_Debug = True

titulo_app = 'MHDigital'

##### Status do BD #####
c_Novo = 'New'
c_Gravado = 'Gra'
c_Adicionar = 'Add'
c_Atualizar = 'Upd'
c_Excluir = 'Del'
c_lista_Status_BD  = {
    c_Gravado   : c_Gravado,
    c_Adicionar : c_Adicionar,
    c_Atualizar : c_Atualizar,
    c_Excluir   : c_Excluir,
}

##### Perfil de usuário #####
c_id_Adm = 1
c_Adm = "Administrador"
c_Adm_txt = "Administrador"
c_id_GestorICEPi = 2
c_GestorICEPi = "GestorICEPi"
c_GestorICEPi_txt = "Gestor ICEPi"
c_id_GestorICEPiVisualizador = 3
c_GestorICEPiVisualizador = "GestorICEPiVisualizador"
c_GestorICEPiVisualizador_txt = "Gestor ICEPi Visualizador"
c_id_GestorEstabelecimento = 4
c_GestorEstabelecimento = "GestorEstabelecimento"
c_GestorEstabelecimento_txt = "Gestor Estabelecimento"
c_id_OperadorEstabelecimento = 5
c_OperadorEstabelecimento ="OperadorEstabelecimento"
c_OperadorEstabelecimento_txt ="Operador Estabelecimento"
c_id_VisualizadorEstabelecimento = 6
c_VisualizadorEstabelecimento ="VisualizadorEstabelecimento"
c_VisualizadorEstabelecimento_txt ="Visualizador Estabelecimento"

c_lista_perfis_usuario  = {
    c_Adm                       : c_Adm_txt,
    c_GestorICEPi               : c_GestorICEPi_txt,
    c_GestorICEPiVisualizador   : c_GestorICEPiVisualizador_txt,
    c_GestorEstabelecimento     : c_GestorEstabelecimento_txt,
    c_OperadorEstabelecimento   : c_OperadorEstabelecimento_txt,
    c_VisualizadorEstabelecimento   : c_VisualizadorEstabelecimento_txt,
}

##### Grupos permitidos para os tipos genéricos #####
c_Comanejo_Cirurgico    = "Comanejo Cirúrgico"
c_Cuidados_Paliativos   = "Cuidados Paliativos"
c_Escore_Charlson       = "Escore de Charlson"
c_Motivo_Admissao       = "Motivo da Admissão"
c_Motivo_Saida          = "Motivo de Saída"
c_Origem_Paciente       = "Origem do Paciente"
c_Profissional          = "Profissional"
c_Tipo_Pendencia        = "Tipo de Pendência"
c_Transferencia_Interna = "Transferência Interna"

c_Grupos_de_Subgrupos = [
    c_Comanejo_Cirurgico,
    c_Cuidados_Paliativos,
    c_Escore_Charlson,
    c_Motivo_Admissao,
    c_Motivo_Saida,
    c_Origem_Paciente,
    c_Profissional,
    c_Tipo_Pendencia,
    c_Transferencia_Interna,
]

c_Grupos_de_Subgrupos_reg = {
    "Comanejo_Cirurgico"    : c_Comanejo_Cirurgico,
    "Cuidados_Paliativos"   : c_Cuidados_Paliativos,
    "Escore_Charlson"       : c_Escore_Charlson,
    "Motivo_Admissao"       : c_Motivo_Admissao,
    "Motivo_Saida"          : c_Motivo_Saida,
    "Origem_Paciente"       : c_Origem_Paciente,
    "Profissional"          : c_Profissional,
    "Tipo_Pendencia"        : c_Tipo_Pendencia,
    "Transferencia_Interna" : c_Transferencia_Interna,
}

sql_select_atendimento = """
    SELECT
        ate.cd_atendimento "cd_atendimento",
        p.cd_paciente "cd_paciente",
        p.nr_cpf "nr_cpf",
        p.nr_cns "nr_cns",
        p.nm_paciente "nm_paciente",
        p.nr_ddd_fone "nr_ddd_fone",
        p.nr_ddd_celular "nr_ddd_celular",
        p.nr_fone "nr_fone",
        p.NR_FONE_COMERCIAL "nr_fone_comercial",
        p.NR_CELULAR "nr_celular",
        p.ds_endereco "ds_endereco",
        p.NR_ENDERECO "nr_endereco",
        p.nm_bairro "nm_bairro",
        p.DS_COMPLEMENTO "ds_complemento",
        p.NR_CEP "nr_cep",
        p.nm_mae "nm_mae",
        TO_CHAR(p.dt_nascimento, 'dd/mm/yyyy') AS "dt_nascimento",
        ci.nm_cidade "nm_cidade",
        ci.cd_uf "cd_uf",
        me.cd_multi_empresa "cd_estabelecimento",
        me.ds_multi_empresa "nm_estabelecimento",
        me.nr_cnes "nr_cnes",
        s.nm_setor "nm_setor",
        uni.ds_unid_int "unidade",
        pres.nm_prestador "nm_medico",
        esp.ds_especialid "especialidade",
        TO_CHAR(ate.dt_atendimento, 'dd/mm/yyyy') || ' ' || TO_CHAR(ate.hr_atendimento, 'hh24:mi') "dt_admissao",
        TO_CHAR(ate.dt_prevista_alta, 'dd/mm/yyyy') "dt_previsao_alta",
        TO_CHAR(ate.dt_alta, 'dd/mm/yyyy') || ' ' || TO_CHAR(ate.hr_alta, 'hh24:mi') "dt_alta",
        TO_CHAR(ate.dt_alta_medica, 'dd/mm/yyyy') || ' ' || TO_CHAR(ate.hr_alta_medica, 'hh24:mi') "dt_alta_medica",
        FLOOR(SYSDATE - ate.DT_ATENDIMENTO) "dias_internacao"
    FROM dbamv.atendime ate
    JOIN dbamv.paciente p ON ate.cd_paciente = p.cd_paciente
    JOIN dbamv.cidade ci ON ci.cd_cidade = p.cd_cidade
    JOIN dbamv.leito le ON le.cd_leito = ate.cd_leito
    JOIN dbamv.multi_empresas me ON me.cd_multi_empresa = ate.cd_multi_empresa
    JOIN dbamv.unid_int uni ON uni.cd_unid_int = le.cd_unid_int
    JOIN dbamv.prestador pres ON ate.cd_prestador = pres.cd_prestador
    JOIN dbamv.especialid esp ON esp.cd_especialid = ate.cd_especialid
    JOIN dbamv.setor s ON s.cd_setor = uni.cd_setor
    WHERE ate.tp_atendimento = 'I'
    AND ate.cd_atendimento = :cd_atendimento
    AND me.nr_cnes = :nr_cnes
"""

sql_select_atendimentos = """
    SELECT
        ate.cd_atendimento "cd_atendimento",
        p.cd_paciente "cd_paciente",
        p.nr_cpf "nr_cpf",
        p.nr_cns "nr_cns",
        p.nm_paciente "nm_paciente",
        p.nr_ddd_fone "nr_ddd_fone",
        p.nr_ddd_celular "nr_ddd_celular",
        p.nr_fone "nr_fone",
        p.NR_FONE_COMERCIAL "nr_fone_comercial",
        p.NR_CELULAR "nr_celular",
        p.ds_endereco "ds_endereco",
        p.NR_ENDERECO "nr_endereco",
        p.nm_bairro "nm_bairro",
        p.DS_COMPLEMENTO "ds_complemento",
        p.NR_CEP "nr_cep",
        p.nm_mae "nm_mae",
        TO_CHAR(p.dt_nascimento, 'dd/mm/yyyy') AS "dt_nascimento",
        ci.nm_cidade "nm_cidade",
        ci.cd_uf "cd_uf",
        me.cd_multi_empresa "cd_estabelecimento",
        me.ds_multi_empresa "nm_estabelecimento",
        me.nr_cnes "nr_cnes",
        s.nm_setor "nm_setor",
        uni.ds_unid_int "unidade",
        pres.nm_prestador "nm_medico",
        esp.ds_especialid "especialidade",
        TO_CHAR(ate.dt_atendimento, 'dd/mm/yyyy') || ' ' || TO_CHAR(ate.hr_atendimento, 'hh24:mi') "dt_admissao",
        TO_CHAR(ate.dt_prevista_alta, 'dd/mm/yyyy') "dt_previsao_alta",
        TO_CHAR(ate.dt_alta, 'dd/mm/yyyy') || ' ' || TO_CHAR(ate.hr_alta, 'hh24:mi') "dt_alta",
        TO_CHAR(ate.dt_alta_medica, 'dd/mm/yyyy') || ' ' || TO_CHAR(ate.hr_alta_medica, 'hh24:mi') "dt_alta_medica",
        FLOOR(SYSDATE - ate.DT_ATENDIMENTO) "dias_internacao"
    FROM dbamv.atendime ate
    JOIN dbamv.paciente p ON ate.cd_paciente = p.cd_paciente
    JOIN dbamv.cidade ci ON ci.cd_cidade = p.cd_cidade
    JOIN dbamv.leito le ON le.cd_leito = ate.cd_leito
    JOIN dbamv.multi_empresas me ON me.cd_multi_empresa = ate.cd_multi_empresa
    JOIN dbamv.unid_int uni ON uni.cd_unid_int = le.cd_unid_int
    JOIN dbamv.prestador pres ON ate.cd_prestador = pres.cd_prestador
    JOIN dbamv.especialid esp ON esp.cd_especialid = ate.cd_especialid
    JOIN dbamv.setor s ON s.cd_setor = uni.cd_setor
    WHERE ate.tp_atendimento = 'I'
    AND ate.cd_atendimento IN (:lista_ids)
    AND me.nr_cnes = :nr_cnes
"""