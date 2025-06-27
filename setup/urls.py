"""
URL configuration for setup project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from conteudo.views import home
from conteudo.views import obter_grupos, obter_perfis_usuario, obter_estabelecimentos, obterTPs, obterTPsProfissional
from conteudo.views import obterPendencias, obterSetores, obterNomeUsuarioLogado, buscar_atendimento
from conteudo.views import estabelecimento, estabelecimento_inserir, estabelecimento_atualizar, estabelecimento_excluir
from conteudo.views import usuario, usuario_inserir, usuario_atualizar, usuario_excluir
from conteudo.views import unidade, unidade_inserir, unidade_atualizar, unidade_excluir
from conteudo.views import cid, cid_inserir, cid_atualizar, cid_excluir
from conteudo.views import profissional, profissional_inserir, profissional_atualizar, profissional_excluir
from conteudo.views import subgrupo, subgrupo_inserir, subgrupo_atualizar, subgrupo_excluir
from conteudo.views import tipo_de_pendencia, tipo_de_pendencia_inserir, tipo_de_pendencia_atualizar, tipo_de_pendencia_excluir
from conteudo.views import pendencia_criar, pendencia, pendencia_salvar, pendencia_listar, obter_pendencia_acompanhamentos
from conteudo.views import dashboard, dashboard2
from conteudo.views import pendencias_por_estabelecimento, pendencias_por_origem, internacoes_por_mes, pendencias_por_mes_alta
from conteudo.views import dashboard_altas_por_motivo_de_admissao, dashboard_altas_por_hora, dashboard_longa_permanecia
from conteudo.views import dashboard_admissoes_e_saidas, dashboard_admissoes, dashboard_altas_dia_da_semana
from conteudo.views import dashboard_altas_x_transferencia, dashboard_previsoes_de_alta, dashboard_tempos_de_permanencia_mh
from conteudo.views import dashboard_tempos_de_permanencia
from conteudo.views import carregar_dados, executar_carga, executar_carga_cid, download_erro
from conteudo.acesso_cidadao import autenticacao, autenticacao_AC, consumir_endpoints, logout_view

urlpatterns = [
    #path('admin/', admin.site.urls),
    path("", pendencia_listar, name="home"),
    path("home/<str:perfil_usuario>/", pendencia_listar, name="home"),

    #Inicia Autenticação no Acesso Cidadão
    path('autenticacao/',autenticacao,name='autenticacao'),
    # Rota de retorno para a aplicação após a autenticação do usuário no AC
    path('autenticacao_AC',autenticacao_AC,name='autenticacao_AC'),
    path('consumir_endpoints',consumir_endpoints,name='consumir_endpoints'),
    path('logout_view', logout_view, name='logout_view'),

    #Rotas utilitárias
    path('obter_grupos/', obter_grupos, name='obter_grupos'),
    path('obter_perfis_usuario/', obter_perfis_usuario, name='obter_perfis_usuario'),
    path('obter_estabelecimentos/', obter_estabelecimentos, name='obter_estabelecimentos'),
    path('obterTPs/', obterTPs, name='obterTPs'),
    path('obterPendencias/<int:tipo_pendencia_id>/', obterPendencias, name='obterPendencias'),
    path('obterSetores/', obterSetores, name='obterSetores'),
    path('obterTPsProfissional/', obterTPsProfissional, name='obterTPsProfissional'),
    path('obterNomeUsuarioLogado/', obterNomeUsuarioLogado, name='obterNomeUsuarioLogado'),
    path('buscar_atendimento/', buscar_atendimento, name='buscar_atendimento'),

    #Estabelecimento
    path('estabelecimento/', estabelecimento, name='estabelecimento'),
    path('estabelecimento_inserir/', estabelecimento_inserir, name='estabelecimento_inserir'),
    path('estabelecimento_atualizar/', estabelecimento_atualizar, name='estabelecimento_atualizar'),
    path('estabelecimento_excluir/', estabelecimento_excluir, name='estabelecimento_excluir'),
    
    #Usuário
    path('usuario/', usuario, name='usuario'),    
    path('usuario_inserir/', usuario_inserir, name='usuario_inserir'),
    path('usuario_atualizar/', usuario_atualizar, name='usuario_atualizar'),
    path('usuario_excluir/', usuario_excluir, name='usuario_excluir'),

    #Subgrupo
    path('subgrupo/', subgrupo, name='subgrupo'),    
    path('subgrupo_inserir/', subgrupo_inserir, name='subgrupo_inserir'),
    path('subgrupo_atualizar/', subgrupo_atualizar, name='subgrupo_atualizar'),
    path('subgrupo_excluir/', subgrupo_excluir, name='subgrupo_excluir'),

    #Tipo de pendência
    path('tipo_de_pendencia/', tipo_de_pendencia, name='tipo_de_pendencia'),    
    path('tipo_de_pendencia_inserir/', tipo_de_pendencia_inserir, name='tipo_de_pendencia_inserir'),
    path('tipo_de_pendencia_atualizar/', tipo_de_pendencia_atualizar, name='tipo_de_pendencia_atualizar'),
    path('tipo_de_pendencia_excluir/', tipo_de_pendencia_excluir, name='tipo_de_pendencia_excluir'),
    
    #Unidade
    path('unidade/', unidade, name='unidade'),    
    path('unidade_inserir/', unidade_inserir, name='unidade_inserir'),
    path('unidade_atualizar/', unidade_atualizar, name='unidade_atualizar'),
    path('unidade_excluir/', unidade_excluir, name='unidade_excluir'),

    #CID
    path('cid/', cid, name='cid'),    
    path('cid_inserir/', cid_inserir, name='cid_inserir'),
    path('cid_atualizar/', cid_atualizar, name='cid_atualizar'),
    path('cid_excluir/', cid_excluir, name='cid_excluir'),    
    
    #Profissional
    path('profissional/', profissional, name='profissional'),    
    path('profissional_inserir/', profissional_inserir, name='profissional_inserir'),
    path('profissional_atualizar/', profissional_atualizar, name='profissional_atualizar'),
    path('profissional_excluir/', profissional_excluir, name='profissional_excluir'),
    
    #Pendência
    path('pendencia_criar/', pendencia_criar, name='pendencia_criar'),
    path('pendencia/<int:id_pendencia>/', pendencia, name='pendencia'),
    path('pendencia_salvar/', pendencia_salvar, name='pendencia_salvar'),
    path('pendencia_listar/', pendencia_listar, name='pendencia_listar'),    
    path('pendencia/<int:id_pendencia_item>/acompanhamentos/', obter_pendencia_acompanhamentos, name='obter_pendencia_acompanhamentos'),

    #Dashboards
    path('dashboard/', dashboard, name='dashboard'),
    path('dashboard2/', dashboard2, name='dashboard2'),
    path('dashboard_altas_por_motivo_de_admissao/', dashboard_altas_por_motivo_de_admissao, name='dashboard_altas_por_motivo_de_admissao'),
    path('dashboard_altas_por_hora/', dashboard_altas_por_hora, name='dashboard_altas_por_hora'),
    path('dashboard_longa_permanecia/', dashboard_longa_permanecia, name='dashboard_longa_permanecia'),
    path('dashboard_admissoes_e_saidas/', dashboard_admissoes_e_saidas, name='dashboard_admissoes_e_saidas'),    
    path('dashboard_admissoes/', dashboard_admissoes, name='dashboard_admissoes'), 
    path('dashboard_altas_dia_da_semana/', dashboard_altas_dia_da_semana, name='dashboard_altas_dia_da_semana'), 
    path('dashboard_altas_x_transferencia/', dashboard_altas_x_transferencia, name='dashboard_altas_x_transferencia'), 
    path('dashboard_previsoes_de_alta/', dashboard_previsoes_de_alta, name='dashboard_previsoes_de_alta'), 
    path('dashboard_tempos_de_permanencia_mh/', dashboard_tempos_de_permanencia_mh, name='dashboard_tempos_de_permanencia_mh'), 
    path('dashboard_tempos_de_permanencia/', dashboard_tempos_de_permanencia, name='dashboard_tempos_de_permanencia'), 
    
    path('pendencias_por_estabelecimento/', pendencias_por_estabelecimento, name='pendencias_por_estabelecimento'),
    path('pendencias_por_origem/', pendencias_por_origem, name='pendencias_por_origem'),
    path('internacoes_por_mes/', internacoes_por_mes, name='internacoes_por_mes'),
    path('pendencias_por_mes_alta/', pendencias_por_mes_alta, name='pendencias_por_mes_alta'),
    
    #Carregar dados do legado
    path('carregar_dados/', carregar_dados, name='carregar_dados'),    
    path('executar_carga/', executar_carga, name='executar_carga'), 
    path('executar_carga_cid/', executar_carga_cid, name='executar_carga_cid'), 
    path('download_erro/', download_erro, name='download_erro'),
]
