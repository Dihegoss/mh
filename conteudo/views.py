from calendar import monthrange
from datetime import datetime, time, timedelta, date
from django.utils import timezone
from django.utils.timezone import make_aware, get_current_timezone
from django.utils.timezone import localtime
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.timezone import now
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import HttpResponse, JsonResponse, FileResponse
from django.db import transaction, IntegrityError, DatabaseError
from django.db.models import Max, Q, ExpressionWrapper, F, DurationField, Avg, Sum, ProtectedError
from django.db.models import Count, Max, Case, When, DateField
from django.db.models.functions import TruncMonth, TruncDate
from django.db.models.functions import ExtractHour, ExtractDay, ExtractMonth, ExtractYear, ExtractWeekDay, Cast
from django.db.models import IntegerField, DurationField, OuterRef, Exists
from django.contrib import messages
from statistics import median
from conteudo.models import Estabelecimento, Usuario, Pessoa, Municipio, Subgrupo, Tipo_Pendencia, Unidade, CID, Profissional
from conteudo.models import Paciente, Pendencia, Pendencia_Item, Pendencia_Item_Acompanhamento, Pendencia_Comanejo
from conteudo.constantes import *
import statistics
import re, os, json
import cx_Oracle
from psycopg2 import DataError
from django.db.utils import OperationalError
from django.core.files.storage import default_storage
import pandas as pd
from django.core.exceptions import ValidationError
from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict

#from decouple import config

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .models import Pendencia  # Importação para evitar importações circulares

def obterApelidoUsuario(request) -> str:
    apelido = ''
    if 'user_details' in request.session:
        if 'apelido' in request.session['user_details']:
            apelido = request.session['user_details'].get('apelido', '')
    
    return apelido

def obterUsuarioLogado(request) -> Usuario:
    usuario_logado = None
    
    if 'user_details' in request.session and 'cpf' in request.session['user_details']:
        cpf_usuario = request.session['user_details'].get('cpf', '')
        
        if 'perfil_usuario' in request.session:
            perfil_usuario = request.session['perfil_usuario']
        
        try:
            #usuario_logado = Usuario.objects.filter(id_pessoa__cpf=cpf_usuario, perfil=perfil_usuario, ativo=True).first()
            usuario_logado = Usuario.objects.filter(id_pessoa__cpf=cpf_usuario,ativo=True).first()
        except Exception as e:
            usuario_logado = None
        
    return usuario_logado

def obterSiglaEstabelecimento(request) -> str:
    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = None

    if usuario_logado:
        if hasattr(usuario_logado, 'id_estabelecimento') and usuario_logado.id_estabelecimento is not None:
            sigla_estabelecimento = usuario_logado.id_estabelecimento.sigla  

    return sigla_estabelecimento


def obterNomeUsuarioLogado(request):
    # Obtenha o usuário logado (supondo que está usando autenticação do Django)
    usuario_logado = obterUsuarioLogado(request)

    if not usuario_logado:
        return JsonResponse({'error': 'Usuário não encontrado'}, status=404)

    # Retorne o nome da pessoa associada ao usuário logado
    return JsonResponse({
                'nome': usuario_logado.id_pessoa.nome  # Nome associado ao usuário
            })    
 
#Obter o perfil do usuário logado no sistema
def obterPerfilUsuario(request) -> str:
    if 'perfil_usuario' in request.session:
        perfil_usuario = request.session['perfil_usuario']
        return perfil_usuario

    if 'user_details' in request.session:
        #Por default perfil de candidato
        perfil_usuario = None

        if 'cpf' in request.session['user_details']:
            cpf_usuario = request.session['user_details'].get('cpf', '')
            try:
                usuarios = Usuario.objects.filter(id_pessoa__cpf=cpf_usuario, ativo=True, perfil_validado=True)

                for usuario in usuarios:
                    usuario_logado = usuario

                try:
                    #perfil_usuario = get_object_or_404(Perfil, id=usuario_logado.id_perfil.id).desc
                    pass
                except Exception as e: 
                    perfil_usuario = None
            except Exception as e:
                perfil_usuario = None
    else: 
        perfil_usuario = None

    request.session['perfil_usuario'] = perfil_usuario
    
    return perfil_usuario

# Create your views here.
def home(request, perfil_usuario=None):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if perfil_usuario != None:
        #------ Informações do Edital ------
        request.session['perfil_usuario'] = perfil_usuario
        
    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)

    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : '',
        "apelido"               : obterApelidoUsuario(request),
        "perfil_usuario"        : obterPerfilUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
    }

    return render(request, "conteudo.html", contexto)

def obter_grupos(request):
    return JsonResponse({'grupos': sorted(c_Grupos_de_Subgrupos)})

def obter_perfis_usuario(request):
    return JsonResponse({'perfis_usuario': list(c_lista_perfis_usuario.values())})

def obter_estabelecimentos(request):
    # Obtém todos os estabelecimentos ordenados por nome
    estabelecimentos = Estabelecimento.objects.all().order_by('nome')

    # Serializa os dados com id e nome
    dados_estabelecimentos = [{
        'id': estabelecimento.id,
        'nome': estabelecimento.nome
    } for estabelecimento in estabelecimentos]

    # Retorna os dados como JSON
    return JsonResponse({'estabelecimentos': dados_estabelecimentos})

def obterTPs(request):
    tipo_de_pendencias = Subgrupo.objects.filter(grupo=c_Tipo_Pendencia).order_by('conteudo')
    tipo_de_pendencias_list = [
        {'id': tp.id, 'conteudo': tp.conteudo} for tp in tipo_de_pendencias
    ]    
    return JsonResponse({'tiposDePendencia': tipo_de_pendencias_list})

def obterPendencias(request, tipo_pendencia_id):
    # Filtra as pendências com base no tipo de pendência
    pendencias = Tipo_Pendencia.objects.filter(id_tp_pendencia=tipo_pendencia_id).order_by('pendencia')
    # Serializa os dados para JSON
    pendencias_data = [{'id': p.id, 'conteudo': p.pendencia} for p in pendencias]
    return JsonResponse(pendencias_data, safe=False)

def obterSetores(request):
    # Filtra as pendências com base no tipo de pendência
    estabelecimentos = Estabelecimento.objects.all().order_by('nome')
    # Serializa os dados para JSON
    estabelecimento_data = [{'id': p.id, 'nome': p.nome} for p in estabelecimentos]
    return JsonResponse(estabelecimento_data, safe=False)

def obterTPsProfissional(request):
    tp_profissionais = Subgrupo.objects.filter(grupo=c_Profissional).order_by('conteudo')
    tipo_de_pendencias_list = [
        {'id': tp.id, 'conteudo': tp.conteudo} for tp in tp_profissionais
    ]    
    return JsonResponse({'tp_profissionais': tipo_de_pendencias_list})

def estabelecimento(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    estabelecimentos = Estabelecimento.objects.all().order_by('nome')
    
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Estabelecimentos',
        "apelido"               : obterApelidoUsuario(request),
        "perfil_usuario"        : obterPerfilUsuario(request),
        "estabelecimentos"      : estabelecimentos,
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
    }

    return render(request, "estabelecimento.html", contexto)

@require_POST
def estabelecimento_inserir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        nome = request.POST.get('nome')
        sigla = request.POST.get('sigla')
        cnes = request.POST.get('cnes')
        mvValor = request.POST.get('mvValor') == 'Sim'  # Convertendo para booleano
        try:
            # Inserindo o novo estabelecimento
            estabelecimento = Estabelecimento.objects.create(
                nome=nome,
                sigla=sigla,
                cnes=cnes,
                mv=mvValor,
                ativo=True,  # Marcar como ativo por padrão
                id_usuario_alteracao = obterUsuarioLogado(request),
            )
            return JsonResponse({'success': True, 'id': estabelecimento.id})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
        
from django.http import JsonResponse

@require_POST
def estabelecimento_atualizar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        # Obter dados do formulário
        id = request.POST.get('id')
        nome = request.POST.get('nome')
        sigla = request.POST.get('sigla')
        cnes = request.POST.get('cnes')
        mv = request.POST.get('mv') == 'true'

        # Atualizar o modelo no banco de dados
        try:
            estabelecimento = Estabelecimento.objects.get(id=id)
            estabelecimento.nome = nome
            estabelecimento.sigla = sigla
            estabelecimento.cnes = cnes
            estabelecimento.mv = mv
            estabelecimento.id_usuario_alteracao = obterUsuarioLogado(request)
            estabelecimento.save()
            return JsonResponse({'success': True})
        except Estabelecimento.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Estabelecimento não encontrado'})
    return JsonResponse({'success': False, 'message': 'Método inválido'})

@require_POST
def estabelecimento_excluir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        id = request.POST.get('id')

        # Excluir o modelo do banco de dados
        try:
            estabelecimento = Estabelecimento.objects.get(id=id)
            estabelecimento.delete()
            return JsonResponse({'success': True})
        except Estabelecimento.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Registro não encontrado.'})

        except ProtectedError:
            return JsonResponse({'success': False, 'message': 'Este registro está sendo utilizado e não pode ser excluído.'})

        except IntegrityError:
            return JsonResponse({'success': False, 'message': 'Erro de integridade ao excluir o registro.'})

        except DatabaseError:
            return JsonResponse({'success': False, 'message': 'Erro de banco de dados ao excluir o registro.'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Erro inesperado: {str(e)}'})
                
    return JsonResponse({'success': False, 'message': 'Método inválido'})

def usuario(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)
    estabelecimentos = Estabelecimento.objects.all().order_by('nome')

    if usuario_logado.perfil in [c_GestorEstabelecimento_txt]:
        usuarios = Usuario.objects.filter(id_estabelecimento=usuario_logado.id_estabelecimento).order_by('id_pessoa__nome')
    else:
        usuarios = Usuario.objects.all().order_by('id_pessoa__nome')

    #Somente perfils para estabelecimento
    c_lista_perfis_usuario_estabelecimento = c_lista_perfis_usuario.copy()

    if usuario_logado.perfil in [c_GestorEstabelecimento_txt]:
        c_lista_perfis_usuario_estabelecimento = {
            chave: valor for chave, valor in c_lista_perfis_usuario_estabelecimento.items() 
            if chave not in {c_Adm, c_GestorICEPi, c_GestorICEPiVisualizador}
        }
      
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Usuários',
        "apelido"               : obterApelidoUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario_estabelecimento,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "usuarios"              : usuarios,
        "estabelecimentos"      : estabelecimentos,
    }

    return render(request, "usuario.html", contexto)

@require_POST
def usuario_inserir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        nome = request.POST.get('nome')
        cpf = re.sub(r'[.\-]', '', request.POST.get('cpf'))
        perfilValor = request.POST.get('perfilValor')
        estabelecimentoValor = request.POST.get('estabelecimentoValor')
        ativoValor = request.POST.get('ativoValor') == 'Sim'  # Convertendo para booleano
        
        with transaction.atomic():
            try:
                pessoa = Pessoa.objects.get(cpf=cpf)   
                pessoa.nome = nome
                pessoa.save()             
            except Exception as e:
                try:
                    pessoa = Pessoa(
                        nome=nome,
                        cpf=cpf,
                        termo_uso=False,
                        ativo=True,
                        id_usuario_alteracao=obterUsuarioLogado(request),  # Usuário logado
                    )
                    pessoa.save()                    
                except Exception as e:
                    return JsonResponse({'success': False, 'error': str(e)})
                
            try:
                
                try:
                    estabelecimento = Estabelecimento.objects.get(id=estabelecimentoValor) 
                except Exception as e:
                    estabelecimento = None
                
                # Inserindo o novo usuário
                usuario = Usuario.objects.create(
                    id_pessoa = pessoa,
                    perfil=perfilValor,
                    id_estabelecimento = estabelecimento,
                    ativo=ativoValor,
                    id_usuario_alteracao=obterUsuarioLogado(request),  # Usuário logado
                )
                return JsonResponse({'success': True, 'id': usuario.id})
            
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})

@require_POST
def usuario_atualizar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        # Obter dados do formulário
        id_usuario = request.POST.get('id_usuario')
        nome = request.POST.get('nome')
        cpf = request.POST.get('cpf', '').replace('.', '').replace('-', '')  # Remover '.' e '-'
        perfil = request.POST.get('perfil')
        id_estabelecimento = request.POST.get('estabelecimento')
        ativo = request.POST.get('ativo') == 'true'

        with transaction.atomic():
            # Atualizar o modelo no banco de dados
            try:
                pessoa = Pessoa.objects.filter(cpf=cpf).first()
                pessoa.nome = nome
                pessoa.id_usuario_alteracao = obterUsuarioLogado(request)
                pessoa.save()
            except Exception as e:
                try:
                    pessoa = Pessoa(
                        nome=nome,
                        cpf=cpf,
                        termo_uso=False,
                        ativo=True,
                        id_usuario_alteracao=obterUsuarioLogado(request),  # Usuário logado
                    )
                    pessoa.save()                    
                except Exception as e:
                    return JsonResponse({'success': False, 'error': str(e)})
                
            try:    
                try: 
                    estabelecimento = Estabelecimento.objects.filter(id=id_estabelecimento).first()
                except Exception as e:
                    estabelecimento = None
                
                usuario = Usuario.objects.get(id=id_usuario)
                usuario.id_pessoa = pessoa
                usuario.perfil = perfil
                usuario.id_estabelecimento = estabelecimento
                usuario.ativo = ativo
                usuario.id_usuario_alteracao = obterUsuarioLogado(request)
                usuario.save()
                return JsonResponse({'success': True})
            
            except Usuario.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Usuário não encontrado'})
        
    return JsonResponse({'success': False, 'message': 'Método inválido'})

@require_POST
def usuario_excluir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        id = request.POST.get('id')

        # Excluir o modelo do banco de dados
        try:
            usuario = Usuario.objects.get(id=id)
            usuario.delete()
            return JsonResponse({'success': True})
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Registro não encontrado.'})

        except ProtectedError:
            return JsonResponse({'success': False, 'message': 'Este registro está sendo utilizado e não pode ser excluído.'})

        except IntegrityError:
            return JsonResponse({'success': False, 'message': 'Erro de integridade ao excluir o registro.'})

        except DatabaseError:
            return JsonResponse({'success': False, 'message': 'Erro de banco de dados ao excluir o registro.'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Erro inesperado: {str(e)}'})
                
    return JsonResponse({'success': False, 'message': 'Método inválido'})

def subgrupo(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)
     
    subgrupos = Subgrupo.objects.all().order_by('grupo', 'conteudo')
      
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Subgrupos',
        "apelido"               : obterApelidoUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "grupos"                : c_Grupos_de_Subgrupos,
        "subgrupos"             : subgrupos,
    }

    return render(request, "subgrupo.html", contexto)

@require_POST
def subgrupo_inserir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        user = obterUsuarioLogado(request)
        grupo = request.POST.get('grupo')
        conteudo = request.POST.get('subgrupo')
        try:
            subgrupo = Subgrupo.objects.create(
                grupo=grupo,
                conteudo=conteudo,
                ativo=True,  # Marcar como ativo por padrão
                id_usuario_alteracao = obterUsuarioLogado(request),
            )
            return JsonResponse({'success': True, 'id': subgrupo.id})
        
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
        
@require_POST
def subgrupo_atualizar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        # Obter dados do formulário
        id_subgrupo = request.POST.get('id_subgrupo')
        grupo = request.POST.get('grupo')
        conteudo = request.POST.get('subgrupo')
        ativo = request.POST.get('ativo') == 'true'

        try:
            subgrupo = Subgrupo.objects.get(id=id_subgrupo)
            subgrupo.grupo = grupo
            subgrupo.conteudo = conteudo
            subgrupo.ativo = ativo
            subgrupo.save()
            return JsonResponse({'success': True})
        except Subgrupo.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Subgrupo não encontrado'})
        
    return JsonResponse({'success': False, 'message': 'Método inválido'})

@require_POST
def subgrupo_excluir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        id_subgrupo = request.POST.get('id_subgrupo')

        try:
            subgrupo = Subgrupo.objects.get(id=id_subgrupo)
            subgrupo.delete()
            return JsonResponse({'success': True})
        except Subgrupo.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Registro não encontrado.'})

        except ProtectedError:
            return JsonResponse({'success': False, 'message': 'Este registro está sendo utilizado e não pode ser excluído.'})

        except IntegrityError:
            return JsonResponse({'success': False, 'message': 'Erro de integridade ao excluir o registro.'})

        except DatabaseError:
            return JsonResponse({'success': False, 'message': 'Erro de banco de dados ao excluir o registro.'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Erro inesperado: {str(e)}'})
                
    return JsonResponse({'success': False, 'message': 'Método inválido'})

def tipo_de_pendencia(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')

    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    tipo_de_pendencias = Subgrupo.objects.filter(grupo=c_Tipo_Pendencia).order_by('conteudo')
    pendencias = Tipo_Pendencia.objects.all().order_by('id_tp_pendencia__conteudo','pendencia')
      
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Tipo de Pendência',
        "apelido"               : obterApelidoUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "tipo_de_pendencias"    : tipo_de_pendencias,
        "pendencias"            : pendencias,
    }

    return render(request, "tipo_de_pendencia.html", contexto)

@require_POST
def tipo_de_pendencia_inserir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        user = obterUsuarioLogado(request)
        id_tipo_de_pendencia = request.POST.get('id_tipo_de_pendencia')
        pendencia = request.POST.get('pendencia')
        try:
            subgrupo_tipo_de_pendencia = Subgrupo.objects.get(id=id_tipo_de_pendencia)
            
            tipo_de_pendencia = Tipo_Pendencia.objects.create(
                id_tp_pendencia=subgrupo_tipo_de_pendencia,
                pendencia=pendencia,
                ativo=True,  # Marcar como ativo por padrão
                id_usuario_alteracao = obterUsuarioLogado(request),
            )
            return JsonResponse({'success': True, 'id': tipo_de_pendencia.id})
        
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
        
@require_POST
def tipo_de_pendencia_atualizar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        # Obter dados do formulário
        id_pendencia = request.POST.get('id_pendencia')
        id_tipo_de_pendencia = request.POST.get('id_tipo_de_pendencia')
        tipo_de_pendencia = request.POST.get('tipo_de_pendencia')
        pendencia = request.POST.get('pendencia')
        ativo = request.POST.get('ativo') == 'true'

        try:
            #tipo_de_pendencia = 
            
            id_tipo_de_pendencia = Subgrupo.objects.get(id=id_tipo_de_pendencia)
            
            tipo_Pendencia = Tipo_Pendencia.objects.get(id=id_pendencia)
            tipo_Pendencia.id_tp_pendencia = id_tipo_de_pendencia
            tipo_Pendencia.pendencia = pendencia
            tipo_Pendencia.ativo = ativo
            tipo_Pendencia.id_usuario_alteracao = obterUsuarioLogado(request)
            tipo_Pendencia.save()
            return JsonResponse({'success': True})
        except Subgrupo.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Pendência não encontrada'})
        
    return JsonResponse({'success': False, 'message': 'Método inválido'})

@require_POST
def tipo_de_pendencia_excluir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        id_pendencia = request.POST.get('id_pendencia')

        try:
            tipo_de_pendencia = Tipo_Pendencia.objects.get(id=id_pendencia)
            tipo_de_pendencia.delete()
            return JsonResponse({'success': True})
        except Tipo_Pendencia.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Registro não encontrado.'})

        except ProtectedError:
            return JsonResponse({'success': False, 'message': 'Este tipo de pendência está sendo utilizado e não pode ser excluído.'})

        except IntegrityError:
            return JsonResponse({'success': False, 'message': 'Erro de integridade ao excluir o registro.'})

        except DatabaseError:
            return JsonResponse({'success': False, 'message': 'Erro de banco de dados ao excluir o registro.'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Erro inesperado: {str(e)}'})


    return JsonResponse({'success': False, 'message': 'Método inválido'})


def unidade(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')

    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    unidades = Unidade.objects.all().order_by('id_estabelecimento__nome', 'unidade')
    estabelecimentos = Estabelecimento.objects.all().order_by('nome')
      
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Unidades',
        "apelido"               : obterApelidoUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "unidades"              : unidades,
        "estabelecimentos"      : estabelecimentos,
    }

    return render(request, "unidade.html", contexto)

@require_POST
def unidade_inserir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        id_estabelecimento = request.POST.get('id_estabelecimento')
        unidade = request.POST.get('unidade')
        
        try:
            estabelecimento = Estabelecimento.objects.get(id=id_estabelecimento) 
            
            unidade = Unidade(
                id_estabelecimento=estabelecimento,
                unidade=unidade,
                ativo=True,
                id_usuario_alteracao=obterUsuarioLogado(request),  # Usuário logado
            )
            unidade.save()     
            
            return JsonResponse({'success': True, 'id': unidade.id}) 
                          
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            

@require_POST
def unidade_atualizar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        # Obter dados do formulário
        id_unidade = request.POST.get('id_unidade')
        id_estabelecimento = request.POST.get('id_estabelecimento')
        unidade_nome = request.POST.get('unidade')
        ativo = request.POST.get('ativo') == 'true'
            
        try:    
            estabelecimento = Estabelecimento.objects.filter(id=id_estabelecimento).first()
            
            unidade = Unidade.objects.get(id=id_unidade)
            unidade.id_estabelecimento = estabelecimento
            unidade.unidade = unidade_nome
            unidade.ativo = ativo
            unidade.id_usuario_alteracao = obterUsuarioLogado(request)
            unidade.save()
            return JsonResponse({'success': True})
        
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Unidade não encontrada'})
        
    return JsonResponse({'success': False, 'message': 'Método inválido'})

@require_POST
def unidade_excluir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        id_unidade = request.POST.get('id_unidade')

        # Excluir o modelo do banco de dados
        try:
            unidade = Unidade.objects.get(id=id_unidade)
            unidade.delete()
            return JsonResponse({'success': True})
        except Unidade.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Registro não encontrado.'})

        except ProtectedError:
            return JsonResponse({'success': False, 'message': 'Este registro está sendo utilizado e não pode ser excluído.'})

        except IntegrityError:
            return JsonResponse({'success': False, 'message': 'Erro de integridade ao excluir o registro.'})

        except DatabaseError:
            return JsonResponse({'success': False, 'message': 'Erro de banco de dados ao excluir o registro.'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Erro inesperado: {str(e)}'})

    return JsonResponse({'success': False, 'message': 'Método inválido'})


def cid(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')

    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    CIDs = CID.objects.all().order_by('codigo', 'desc')
      
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'CDIs',
        "apelido"               : obterApelidoUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "CIDs"                  : CIDs,
    }

    return render(request, "cid.html", contexto)

@require_POST
def cid_inserir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        id_estabelecimento = request.POST.get('id_estabelecimento')
        unidade = request.POST.get('unidade')
        
        try:
            estabelecimento = Estabelecimento.objects.get(id=id_estabelecimento) 
            
            unidade = Unidade(
                id_estabelecimento=estabelecimento,
                unidade=unidade,
                ativo=True,
                id_usuario_alteracao=obterUsuarioLogado(request),  # Usuário logado
            )
            unidade.save()     
            
            return JsonResponse({'success': True, 'id': unidade.id}) 
                          
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            

@require_POST
def cid_atualizar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        # Obter dados do formulário
        id_unidade = request.POST.get('id_unidade')
        id_estabelecimento = request.POST.get('id_estabelecimento')
        unidade_nome = request.POST.get('unidade')
        ativo = request.POST.get('ativo') == 'true'
            
        try:    
            estabelecimento = Estabelecimento.objects.filter(id=id_estabelecimento).first()
            
            unidade = Unidade.objects.get(id=id_unidade)
            unidade.id_estabelecimento = estabelecimento
            unidade.unidade = unidade_nome
            unidade.ativo = ativo
            unidade.id_usuario_alteracao = obterUsuarioLogado(request)
            unidade.save()
            return JsonResponse({'success': True})
        
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Unidade não encontrada'})
        
    return JsonResponse({'success': False, 'message': 'Método inválido'})

@require_POST
def cid_excluir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        id_cid = request.POST.get('id_cid')

        # Excluir o modelo do banco de dados
        try:
            cid = CID.objects.get(id=id_cid)
            cid.delete()
            return JsonResponse({'success': True})
        except CID.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Registro não encontrado.'})

        except ProtectedError:
            return JsonResponse({'success': False, 'message': 'Este registro está sendo utilizado e não pode ser excluído.'})

        except IntegrityError:
            return JsonResponse({'success': False, 'message': 'Erro de integridade ao excluir o registro.'})

        except DatabaseError:
            return JsonResponse({'success': False, 'message': 'Erro de banco de dados ao excluir o registro.'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Erro inesperado: {str(e)}'})
        
    return JsonResponse({'success': False, 'message': 'Método inválido'})


def profissional(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')

    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    subgrupos = Subgrupo.objects.filter(grupo=c_Profissional).order_by('conteudo')

    if usuario_logado.perfil in [c_Adm_txt, c_GestorICEPi_txt]:
        profissionais = Profissional.objects.all().order_by('id_estabelecimento__nome', 'id_tp_profissional__conteudo', 'id_pessoa__nome')
        estabelecimentos = Estabelecimento.objects.all().order_by('nome')
    else:
        estabelecimentos = Estabelecimento.objects.filter(id=usuario_logado.id_estabelecimento.id).order_by('nome')
        if not sigla_estabelecimento is None:
            profissionais = Profissional.objects.filter(id_estabelecimento=usuario_logado.id_estabelecimento)
        else:
            profissionais = Profissional.objects.none()  
      
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Profissionais',
        "apelido"               : obterApelidoUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        'subgrupos'             : subgrupos,
        "profissionais"         : profissionais,
        "estabelecimentos"      : estabelecimentos,
    }

    return render(request, "profissional.html", contexto)

@require_POST
def profissional_inserir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        id_estabelecimento = request.POST.get('id_estabelecimento')
        id_tp_profissional = request.POST.get('id_tp_profissional')
        nome = request.POST.get('nome')
        cpf = re.sub(r'[.\-]', '', request.POST.get('cpf'))

        with transaction.atomic():
            try:
                pessoa = Pessoa.objects.get(cpf=cpf)   
                pessoa.nome = nome
                pessoa.save()             
            except Exception as e:
                try:
                    pessoa = Pessoa(
                        nome=nome,
                        cpf=cpf,
                        termo_uso=False,
                        ativo=True,
                        id_usuario_alteracao=obterUsuarioLogado(request),  # Usuário logado
                    )
                    pessoa.save()                    
                except Exception as e:
                    return JsonResponse({'success': False, 'error': str(e)})
            try:
                estabelecimento = Estabelecimento.objects.get(id=id_estabelecimento) 
                tp_profissional = Subgrupo.objects.get(id=id_tp_profissional)
                
                profissional = Profissional(
                    id_estabelecimento=estabelecimento,
                    id_pessoa=pessoa,
                    id_tp_profissional=tp_profissional,
                    ativo=True,
                    id_usuario_alteracao=obterUsuarioLogado(request),  # Usuário logado
                )
                profissional.save()     
                
                return JsonResponse({'success': True, 'id': profissional.id}) 
                          
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})
            

@require_POST
def profissional_atualizar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        # Obter dados do formulário
        id_profissional = request.POST.get('id_profissional')
        id_estabelecimento = request.POST.get('id_estabelecimento')
        id_tp_profissional = request.POST.get('id_tp_profissional')
        nome = request.POST.get('nome')
        cpf = request.POST.get('cpf', '').replace('.', '').replace('-', '')  # Remover '.' e '-'
        ativo = request.POST.get('ativo') == 'true'
        
        with transaction.atomic():
            # Atualizar o modelo no banco de dados
            try:
                pessoa = Pessoa.objects.filter(cpf=cpf).first()
                pessoa.nome = nome
                pessoa.id_usuario_alteracao = obterUsuarioLogado(request)
                pessoa.save()
            except Exception as e:
                try:
                    pessoa = Pessoa(
                        nome=nome,
                        cpf=cpf,
                        termo_uso=False,
                        ativo=True,
                        id_usuario_alteracao=obterUsuarioLogado(request),  # Usuário logado
                    )
                    pessoa.save()                    
                except Exception as e:
                    return JsonResponse({'success': False, 'error': str(e)})
                
            try:    
                profissional = Profissional.objects.filter(id=id_profissional).first()
                estabelecimento = Estabelecimento.objects.filter(id=id_estabelecimento).first()
                tp_profissional = Subgrupo.objects.filter(id=id_tp_profissional).first()
                
                profissional.id_estabelecimento = estabelecimento
                profissional.id_tp_profissional = tp_profissional
                profissional.id_pessoa = pessoa
                profissional.ativo = ativo
                profissional.id_usuario_alteracao = obterUsuarioLogado(request)
                profissional.save()
                return JsonResponse({'success': True})
            
            except Usuario.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Profissional não encontrada'})
        
    return JsonResponse({'success': False, 'message': 'Método inválido'})

@require_POST
def profissional_excluir(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == 'POST':
        id_profissional = request.POST.get('id_profissional')

        # Excluir o modelo do banco de dados
        try:
            profissional = Profissional.objects.get(id=id_profissional)
            profissional.delete()
            return JsonResponse({'success': True})
        except Profissional.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Registro não encontrado.'})

        except ProtectedError:
            return JsonResponse({'success': False, 'message': 'Este registro está sendo utilizado e não pode ser excluído.'})

        except IntegrityError:
            return JsonResponse({'success': False, 'message': 'Erro de integridade ao excluir o registro.'})

        except DatabaseError:
            return JsonResponse({'success': False, 'message': 'Erro de banco de dados ao excluir o registro.'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Erro inesperado: {str(e)}'})
        
    return JsonResponse({'success': False, 'message': 'Método inválido'})


def pendencia_criar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')

    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    

    if sigla_estabelecimento is None:
        messages.error(request, 'Usuário sem estabelecimento atribuído')
        return redirect('home')  # Redirecione para a página desejada
    
    pendencia = None
      
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Criar Pendência',
        "apelido"               : obterApelidoUsuario(request),
        "status_pendencia"      : c_Novo,
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "pendencia"             : pendencia,
    }

    return render(request, "pendencia_criar.html", contexto)

def pendencia(request, id_pendencia=None):
    if 'access_token' not in request.session:
        return redirect('autenticacao')  # Redireciona para a tela de login se não houver um access_token

    pendencia = None
    pendencia_comanejos = pendencia_itens = pendencia_itens_acompanhamentos = []

    # Verifica se é uma requisição POST
    if request.method == 'POST':
        # Pega os dados do formulário
        
        if id_pendencia == 0:
            nr_atendimento_mv = request.POST.get('nr_atendimento_mv')
            nr_paciente_mv = request.POST.get('nr_paciente_mv')
            paciente_nome = request.POST.get('paciente_nome')
            nr_cpf = request.POST.get('nr_cpf')
            nr_cns = request.POST.get('nr_cns')
            dt_nascimento_mv = request.POST.get('dt_nascimento')
            dt_nascimento = datetime.strptime(dt_nascimento_mv, "%d/%m/%Y").date()
            nome_mae = request.POST.get('nome_mae')
            municipio_mv = request.POST.get('municipio_mv')
            estabelecimento_mv = request.POST.get('estabelecimento_mv')
            nr_cnes = request.POST.get('nr_cnes')
            unidade_mv = request.POST.get('unidade_mv')
            dt_hr_admissao_hospitalar = request.POST.get('dt_hr_admissao_hospitalar')
            dt_previsao_alta = request.POST.get('dt_previsao_alta')
            dt_hr_alta_medica = request.POST.get('dt_hr_alta_medica')
            dt_hr_alta_hospitalar = request.POST.get('dt_hr_alta_hospitalar')

            if (dt_previsao_alta):
                dt_previsao_alta=datetime.strptime(dt_previsao_alta, "%d/%m/%Y").strftime("%Y-%m-%d")

            dt_hr_alta_medica_formatada = None
            if (dt_hr_alta_medica):
                dt_hr_alta_medica_formatada = dt_hr_alta_medica

            dt_hr_alta_hospitalar_formatada = None
            if (dt_hr_alta_hospitalar):
                dt_hr_alta_hospitalar_formatada = dt_hr_alta_hospitalar

            # Se o paciente não existir, você pode criá-lo
            paciente = Paciente(
                nome=paciente_nome,
                dt_nascimento=dt_nascimento,
                nome_mae=nome_mae,
                nr_cpf=nr_cpf,
                nr_cns=nr_cns,
            )

            pendencia = Pendencia(
                id_paciente=paciente,
                nr_atendimento_mv=nr_atendimento_mv,
                nr_paciente_mv=nr_paciente_mv,
                municipio_mv=municipio_mv,
                uf_mv=None,  # Ajuste conforme necessário
                estabelecimento_mv=estabelecimento_mv,  # Ajuste conforme necessário
                unidade_mv=unidade_mv,
                dt_hr_admissao_hospitalar=dt_hr_admissao_hospitalar,
                dt_previsao_alta=dt_previsao_alta,
                dt_hr_alta_medica=dt_hr_alta_medica_formatada,
                dt_hr_alta_hospitalar=dt_hr_alta_hospitalar_formatada,
            )

            pendencia.status = c_Novo
            nr_cnes = str(nr_cnes).zfill(7)
            estabelecimento=Estabelecimento.objects.filter(cnes=nr_cnes).first()
        else:
            return JsonResponse({'success': False, 'message': 'Erro ao criar o atendimento'})

    elif request.method == 'GET':
            pendencia = Pendencia.objects.get(id=id_pendencia)
            estabelecimento=pendencia.id_estabelecimento
            pendencia.status = c_Atualizar
            pendencia.comanejo_sim_nao_inicial = pendencia.comanejo_sim_nao
            
            try: pendencia_comanejos = Pendencia_Comanejo.objects.filter(id_pendencia=pendencia)
            except: pendencia_comanejos = []
            
            try: pendencia_itens = Pendencia_Item.objects.filter(id_pendencia=pendencia)
            except: pendencia_itens = []
            
            try: pendencia_itens_acompanhamentos = Pendencia_Item_Acompanhamento.objects.filter(id_pendencia_item__in=pendencia_itens)
            except: pendencia_itens_acompanhamentos = []

    else:
        return JsonResponse({'success': False, 'message': 'Erro ao exibir o atendimento'})

    subgrupos = Subgrupo.objects.filter(ativo=True).order_by('grupo', 'conteudo') 
    unidades = Unidade.objects.filter(ativo=True).order_by('id_estabelecimento__nome') 
    #profissionais = Profissional.objects.all().order_by('id_pessoa__nome') 
    profissionais = Profissional.objects.filter(id_estabelecimento=estabelecimento, ativo=True).order_by('id_pessoa__nome')
    tipo_pendencias = Tipo_Pendencia.objects.filter(ativo=True).order_by('pendencia')
    CIDs = CID.objects.filter(ativo=True)

    so_visualizacao = False
    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    
    if usuario_logado.perfil == c_GestorICEPiVisualizador_txt or sigla_estabelecimento is None:
        so_visualizacao = True

    contexto = {
        "titulo_01"                         : titulo_app,
        "titulo_02"                         : 'Pendência',
        "status_pendencia"                  : pendencia.status, #Ajustar - c_Novo, c_Gravado, c_Atualizar, etc...
        "apelido"                           : obterApelidoUsuario(request),
        "perfis_usuario"                    : c_lista_perfis_usuario,
        "perfil_usuario_logado"             : usuario_logado.perfil,
        "sigla_estabelecimento"             : sigla_estabelecimento,        
        "grupos"                            : c_Grupos_de_Subgrupos_reg,
        "subgrupos"                         : subgrupos,
        "unidades"                          : unidades,
        "profissionais"                     : profissionais,
        "tipo_pendencias"                   : tipo_pendencias,
        "pendencia"                         : pendencia,
        "pendencia_comanejos"               : pendencia_comanejos,
        "pendencia_itens"                   : pendencia_itens,
        "pendencia_itens_acompanhamentos"   : pendencia_itens_acompanhamentos,
        "estabelecimento"                   : estabelecimento,
        "CIDs"                              : CIDs,
        "so_visualizacao"                   : so_visualizacao,
    }

    # Renderiza o template pendencia.html
    return render(request, "pendencia.html", contexto)


def pendencia_listar(request, perfil_usuario=None):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    

    if usuario_logado.perfil in [c_Adm_txt, c_GestorICEPi_txt, c_GestorICEPiVisualizador_txt]:
        pendencias = Pendencia.objects.all().order_by('encerrada', 'dt_previsao_alta')
    else:
        filtro = request.GET.get('filtro', 'meus')
        
        if not sigla_estabelecimento is None:
            if filtro == 'meus':
                pendencias = Pendencia.objects.filter(id_estabelecimento=usuario_logado.id_estabelecimento, id_usuario_criacao=usuario_logado, encerrada=False)
            elif filtro == 'ativos':
                pendencias = Pendencia.objects.filter(id_estabelecimento=usuario_logado.id_estabelecimento, encerrada=False)
            elif filtro == 'todos':
                pendencias = Pendencia.objects.filter(id_estabelecimento=usuario_logado.id_estabelecimento)
            else:
                pendencias = Pendencia.objects.none()  
        else:
            pendencias = Pendencia.objects.none()      

    # Obtém os últimos acompanhamentos de cada Pendencia
    if pendencias.exists():
        ultimos_acompanhamentos = (
            Pendencia_Item_Acompanhamento.objects
            .filter(id_pendencia_item__id_pendencia__in=pendencias)
            .values('id_pendencia_item__id_pendencia')  
            .annotate(ultima_data=Max('dt_hr_criacao'))  
        )

        # Criar um dicionário {id_pendencia: descricao_ultimo_acompanhamento}
        acompanhamento_dict = {
            a['id_pendencia_item__id_pendencia']: Pendencia_Item_Acompanhamento.objects
            .filter(id_pendencia_item__id_pendencia=a['id_pendencia_item__id_pendencia'], dt_hr_criacao=a['ultima_data'])
            .values_list('descricao', flat=True)
            .first()
            for a in ultimos_acompanhamentos
        }

        # Atribuir o último acompanhamento às pendências
        for pendencia in pendencias:
            pendencia.ultimo_acompanhamento = acompanhamento_dict.get(pendencia.id, "Sem acompanhamento registrado")

    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Pendências',
        "apelido"               : obterApelidoUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "pendencias"            : pendencias,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,
    }

    return render(request, "pendencia_listar.html", contexto)


@csrf_exempt
def buscar_atendimento(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        nr_atendimento_mv = request.POST.get('nr_atendimento_mv')
        
        if nr_atendimento_mv:
            usuario_logado = obterUsuarioLogado(request)
            
            if (usuario_logado.id_estabelecimento == None):
                return JsonResponse({'success': False, 'message': 'Usuário sem estabelecimento associado'})

            nr_cnes = usuario_logado.id_estabelecimento.cnes

            try:
                connection, str_conectar = conectar_mv(nr_cnes)

                if connection is None:
                    return JsonResponse({'success': False, 'message': f'Erro ao conectar no banco de dados do MV. {str_conectar}'})
                
            except cx_Oracle.DatabaseError as e:
                error, = e.args
                return JsonResponse({'success': False, 'message': error.message})
            except cx_Oracle.InterfaceError as e:
                return JsonResponse({'success': False, 'message': {e}})
            except Exception as e:
                return JsonResponse({'success': False, 'message': {e}})
            
            cursor = connection.cursor()
            cursor.execute(sql_select_atendimento, {'cd_atendimento': nr_atendimento_mv, 'nr_cnes': nr_cnes})
            cursor.rowfactory = lambda *args: dict(zip([d[0].lower() for d in cursor.description], args))
            row = cursor.fetchone()

            if row:
                paciente_nome               = row['nm_paciente']
                nr_atendimento_mv           = row['cd_atendimento']
                nr_paciente_mv              = row['cd_paciente']
                nr_cpf                      = row['nr_cpf']
                nr_cns                      = row['nr_cns']
                dt_nascimento               = row['dt_nascimento']
                nome_mae                    = row['nm_mae']
                municipio_mv                = row['nm_cidade']
                estabelecimento_mv          = row['nm_estabelecimento']

                nr_ddd_fone                 = row['nr_ddd_fone']
                nr_ddd_celular              = row['nr_ddd_celular']
                nr_fone                     = row['nr_fone']
                nr_fone_comercial           = row['nr_fone_comercial']
                nr_celular                  = row['nr_celular']
                ds_endereco                 = row['ds_endereco']
                nr_endereco                 = row['nr_endereco']
                nm_bairro                   = row['nm_bairro']
                ds_complemento              = row['ds_complemento']
                nr_cep                      = row['nr_cep']
                cd_uf                       = row['cd_uf']
                nr_cnes                     = row['nr_cnes']
                nm_setor                    = row['nm_setor']
                unidade_mv                  = row['unidade']
                nm_medico                   = row['nm_medico']
                especialidade               = row['especialidade']
                dt_hr_admissao_hospitalar   = row['dt_admissao']
                dt_previsao_alta            = row['dt_previsao_alta']
                dias_internacao             = row['dias_internacao']
                dt_hr_alta_medica           = row['dt_alta_medica']
                dt_hr_alta_hospitalar       = row['dt_alta']

                #dt_hr_alta_medica = dt_hr_alta_medica + " " + "00:00"
                #dt_hr_alta_medica_obj = datetime.strptime(dt_hr_alta_medica, '%d/%m/%Y %H:%M') #GHS
                #dt_hr_alta_hospitalar = dt_hr_alta_hospitalar + " " + "00:00"
                #dt_hr_alta_hospitalar_obj = datetime.strptime(dt_hr_alta_hospitalar, '%d/%m/%Y %H:%M') #GHS


                # Converter dt_admissao para o formato datetime-local
                #dt_admissao_formatted = ""
                #if dt_admissao:
                #    dt_admissao_parts = dt_admissao.split(' ')
                #    if len(dt_admissao_parts) == 2:
                #        date_part = dt_admissao_parts[0].split('/')
                #        time_part = dt_admissao_parts[1]
                #        dt_admissao_formatted = f"{date_part[2]}-{date_part[1]}-{date_part[0]}T{time_part}"

                # Converter previsao_alta para o formato date
                #previsao_alta_formatted = ""
                #if dt_previsao_alta:
                #    previsao_alta_parts = dt_previsao_alta.split('/')
                #    if len(previsao_alta_parts) == 3:
                #        previsao_alta_formatted = f"{previsao_alta_parts[2]}-{previsao_alta_parts[1]}-{previsao_alta_parts[0]}"

                data = {
                            'nr_atendimento_mv'         : nr_atendimento_mv,
                            'nr_paciente_mv'            : nr_paciente_mv,
                            'paciente_nome'             : paciente_nome,
                            'nome_mae'                  : nome_mae,
                            'municipio_mv'              : municipio_mv,
                            'nr_cpf'                    : nr_cpf,
                            'nr_cns'                    : nr_cns,
                            'nr_ddd_fone'               : nr_ddd_fone,
                            'nr_ddd_celular'            : nr_ddd_celular,
                            'nr_fone'                   : nr_fone,
                            'nr_fone_comercial'         : nr_fone_comercial,
                            'nr_celular'                : nr_celular,
                            'ds_endereco'               : ds_endereco,
                            'nr_endereco'               : nr_endereco,
                            'nm_bairro'                 : nm_bairro,
                            'ds_complemento'            : ds_complemento,
                            'nr_cep'                    : nr_cep,
                            'dt_nascimento'             : dt_nascimento,
                            'cd_uf'                     : cd_uf,
                            'estabelecimento_mv'        : estabelecimento_mv,
                            'nr_cnes'                   : nr_cnes,
                            'nm_setor'                  : nm_setor,
                            'unidade_mv'                : unidade_mv,
                            'nm_medico'                 : nm_medico,
                            'especialidade'             : especialidade,
                            'dt_hr_admissao_hospitalar' : dt_hr_admissao_hospitalar,
                            'dt_previsao_alta'          : dt_previsao_alta,
                            'dias_internacao'           : dias_internacao,
                            'dt_hr_alta_medica'         : dt_hr_alta_medica,
                            'dt_hr_alta_hospitalar'     : dt_hr_alta_hospitalar,
                }
                data.update({'success': True})
                return JsonResponse(data)
            else:
                return JsonResponse({'success': False, 'message': 'Código de atendimento não encontrado'})
        
    return JsonResponse({'success': False, 'message': 'Código de atendimento não encontrado'})

@require_POST
def pendencia_salvar(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    if request.method == 'POST':
        
        usuario_logado = obterUsuarioLogado(request)

        ####################################################################
        ###    obter Dados do bloco de identificação                     ###
        ####################################################################
        status_pendencia = request.POST.get('status_pendencia', None)
        id_pendencia = request.POST.get('id_pendencia', None)        
        nomePaciente = request.POST.get('nomePaciente')
        nr_cpf = request.POST.get('nr_cpf')
        nr_cns = request.POST.get('nr_cns')
        codigoAtendimento = request.POST.get('codigoAtendimento')
        codigoPaciente = request.POST.get('codigoPaciente')
        dataNascimento = request.POST.get('dataNascimento')
        nomeMae = request.POST.get('nomeMae')
        estabelecimento_mv = request.POST.get('estabelecimento')
        municipio_mv = request.POST.get('municipio_mv')
        uf_mv = request.POST.get('uf_mv')

        ####################################################################
        ###    obter Dados do bloco de Internação                        ###
        ####################################################################
        unidade_mv = request.POST.get('unidade_mv')
        id_enfermeiro = request.POST.get('id_enfermeiro')
        id_medico = request.POST.get('id_medico')
        id_origem_paciente = request.POST.get('id_origemPaciente')
        id_motivo_admissao = request.POST.get('id_motivoAdmissao')
        score_de_charlson = request.POST.get('score_de_charlson')
        id_cuidados_paliativos = request.POST.get('id_cuidadosPaliativos')
        dataAdmissaoHospitalar = request.POST.get('dataAdmissaoHospitalar')
        previsaoAlta = request.POST.get('previsaoAlta')
        dataAdmissaoMH = request.POST.get('dataAdmissaoMH')

        ####################################################################
        ###    obter Dados do bloco de Comanejo                          ###
        ####################################################################
        comanejo_sim_nao = request.POST.get('comanejo_sim_nao') == 'true'
        comanejo_itens = json.loads(request.POST.get('comanejo_itens'))

        ####################################################################
        ###    obter Dados do bloco de Pendência                         ###
        ####################################################################
        pendencia_itens = json.loads(request.POST.get('pendencia_itens'))

        ####################################################################
        ###    obter Dados dos acompanhamentos do item de pendência      ###
        ####################################################################
        acompanhamentos_itens = json.loads(request.POST.get('acompanhamentos_itens'))

        ####################################################################
        ###    obter Dados do bloco de Alta                              ###
        ####################################################################
        id_motivo_saida = request.POST.get('id_motivoSaida')
        id_cid = request.POST.get('id_cid')
        id_setor = request.POST.get('id_setor')
        dataHoraAltaMedica = request.POST.get('dataHoraAltaMedica')
        dataHoraAltaHospitalar = request.POST.get('dataHoraAltaHospitalar')  
        
        id_estabelecimento = usuario_logado.id_estabelecimento

        try:
            #Criação dos objetos
            with transaction.atomic():

                
                enfermeiro = medico = origem_paciente = motivo_admissao = motivo_saida = cid = setor = None

                if (id_enfermeiro):             enfermeiro          = Profissional.objects.get(id=id_enfermeiro)
                if (id_medico):                 medico              = Profissional.objects.get(id=id_medico)
                if (id_origem_paciente):        origem_paciente     = Subgrupo.objects.get(id=id_origem_paciente)
                if (id_motivo_admissao):        motivo_admissao     = Subgrupo.objects.get(id=id_motivo_admissao)
                if (id_cuidados_paliativos):    cuidados_paliativos = Subgrupo.objects.get(id=id_cuidados_paliativos)
                if (id_motivo_saida):           motivo_saida        = Subgrupo.objects.get(id=id_motivo_saida)
                if (id_cid):                    cid                 = CID.objects.get(id=id_cid)
                if (id_setor):                  setor               = Subgrupo.objects.get(id=id_setor)

                nr_cpf = str(nr_cpf).zfill(11)

                paciente, criado = Paciente.objects.get_or_create(
                    nome=nomePaciente,
                    nome_mae=nomeMae,
                    dt_nascimento=datetime.strptime(dataNascimento, "%d/%m/%Y").date(),
                    defaults={  # Valores padrão para novos registros
                        "nr_cpf": nr_cpf,
                        "nr_cns": nr_cns,
                        "id_usuario_alteracao": usuario_logado,  # Certifique-se de ter um usuário válido
                    }
                )
                
                try:    
                    if (score_de_charlson == ''):       score_de_charlson       = None
                    if (dataAdmissaoMH == ''):          dataAdmissaoMH          = None
                    if (previsaoAlta == ''):            previsaoAlta            = None
                    if (dataHoraAltaMedica == ''):      dataHoraAltaMedica      = None
                    if (dataHoraAltaHospitalar == ''):  dataHoraAltaHospitalar  = None

                    dataAdmissaoHospitalar_formatada = datetime.strptime(dataAdmissaoHospitalar, "%d/%m/%Y %H:%M")
                    dataAdmissaoHospitalar_aware = timezone.make_aware(dataAdmissaoHospitalar_formatada, timezone.get_default_timezone())
                        
                    if id_pendencia in [None, "None"]:  # Criar novo registro
                        pendencia = Pendencia.objects.create(
                            nr_atendimento_mv=codigoAtendimento,
                            id_paciente=paciente,
                            nr_paciente_mv=codigoPaciente,
                            id_estabelecimento=id_estabelecimento,
                            estabelecimento_mv=estabelecimento_mv,
                            unidade_mv=unidade_mv,
                            id_enfermeiro=enfermeiro,
                            id_medico=medico,
                            id_origem_paciente=origem_paciente,
                            id_motivo_admissao=motivo_admissao,
                            score_charlson=score_de_charlson,
                            id_cuidados_paliativos=cuidados_paliativos,
                            dt_hr_admissao_hospitalar=dataAdmissaoHospitalar_aware,
                            dt_hr_admissao_MH=dataAdmissaoMH,
                            dt_previsao_alta=previsaoAlta,
                            comanejo_sim_nao=comanejo_sim_nao,
                            id_motivo_saida=motivo_saida,
                            id_cid=cid,
                            id_setor=setor,
                            dt_hr_alta_medica=dataHoraAltaMedica,
                            dt_hr_alta_hospitalar=dataHoraAltaHospitalar,
                            dt_hr_criacao=now(),
                            id_usuario_criacao=usuario_logado,
                            id_usuario_alteracao=usuario_logado,
                            municipio_mv=municipio_mv,
                            uf_mv=uf_mv,
                            encerrada=False,                                                             
                        )
                    else:  # Atualizar ou criar se ID existir
                        try:
                            pendencia = Pendencia.objects.get(id=id_pendencia)
                        
                            pendencia.nr_atendimento_mv=codigoAtendimento
                            pendencia.id_paciente=paciente
                            pendencia.nr_paciente_mv=codigoPaciente
                            pendencia.id_estabelecimento=id_estabelecimento
                            pendencia.estabelecimento_mv=estabelecimento_mv
                            pendencia.unidade_mv=unidade_mv
                            pendencia.id_enfermeiro=enfermeiro
                            pendencia.id_medico=medico
                            pendencia.id_origem_paciente=origem_paciente
                            pendencia.id_motivo_admissao=motivo_admissao
                            pendencia.score_charlson=score_de_charlson
                            pendencia.id_cuidados_paliativos=cuidados_paliativos
                            pendencia.dt_hr_admissao_hospitalar=dataAdmissaoHospitalar_aware
                            pendencia.dt_hr_admissao_MH=dataAdmissaoMH
                            pendencia.dt_previsao_alta=previsaoAlta
                            pendencia.comanejo_sim_nao=comanejo_sim_nao
                            pendencia.id_motivo_saida=motivo_saida
                            pendencia.id_cid=cid
                            pendencia.id_setor=setor
                            pendencia.dt_hr_alta_medica=dataHoraAltaMedica
                            pendencia.dt_hr_alta_hospitalar=dataHoraAltaHospitalar
                            pendencia.id_usuario_alteracao=usuario_logado
                            pendencia.municipio_mv=municipio_mv
                            pendencia.uf_mv=uf_mv
                            pendencia.encerrada=False     
                                                                                    
                            pendencia.save()                        
                        except Exception as e:
                            return JsonResponse({'success': False, 'message': str(e)})

                    #Comanejo
                    for item in comanejo_itens:
                        id_comanejo = item.get('id_comanejo')
                        id_especialidade_comanejo = item.get('id_especialidade_comanejo')
                        especialidadecomanejo = Subgrupo.objects.get(id=id_especialidade_comanejo)
                        
                        dtAdmissaoComanejo = item.get('dtAdmissaoComanejo')
                        if dtAdmissaoComanejo and dtAdmissaoComanejo.strip():
                            dt_admissao_formatada = datetime.strptime(dtAdmissaoComanejo, "%d/%m/%Y").date()
                        else:
                            dt_admissao_formatada = None  # Deixa como None caso não haja uma data válida

                        dtSaidaComanejo = item.get('dtHrSaidaComanejo')
                        if dtSaidaComanejo and dtSaidaComanejo.strip():
                            dt_saida_formatada = datetime.strptime(dtAdmissaoComanejo, "%d/%m/%Y").date()
                        else:
                            dt_saida_formatada = None  # Deixa como None caso não haja uma data válida
                        
                        if id_comanejo in [None, "None", '']:  # Criar novo registro
                            pendencia_comanejo = Pendencia_Comanejo.objects.create(
                                id_pendencia=pendencia,
                                id_especialidade=especialidadecomanejo,
                                dt_admissao=dt_admissao_formatada,
                                dt_saida=dt_saida_formatada,
                                id_usuario_alteracao=obterUsuarioLogado(request),                                                                                   
                            )
                        else:  # Atualizar ou criar se ID existir
                            try:
                                pendencia_comanejo = Pendencia_Comanejo.objects.get(id=id_comanejo)
                                
                                pendencia_comanejo.id_pendencia=pendencia
                                pendencia_comanejo.id_especialidade=especialidadecomanejo
                                pendencia_comanejo.dt_admissao=dt_admissao_formatada
                                pendencia_comanejo.dt_saida=dt_saida_formatada
                                pendencia_comanejo.id_usuario_alteracao=obterUsuarioLogado(request)                                  
                                
                                pendencia_comanejo.save()                        
                            except Exception as e:
                                return JsonResponse({'success': False, 'message': str(e)})

                    #Itens da pendencia
                    for item in pendencia_itens:
                        id_pendencia_item = item.get('id_pendencia_item')
                        id_pendencia_id = item.get('id_pendencia')
                        tp_pendencia = Tipo_Pendencia.objects.get(id=id_pendencia_id)
                        
                        dt_hr_inicio_pendencia = item.get('dt_hr_inicio_pendencia')
                        if dt_hr_inicio_pendencia and dt_hr_inicio_pendencia.strip():
                            dt_hr_inicio_pendencia_obj = datetime.strptime(dt_hr_inicio_pendencia, "%d/%m/%Y %H:%M")
                            dt_hr_inicio_pendencia_formatada = make_aware(dt_hr_inicio_pendencia_obj)
                        else:
                            dt_hr_inicio_pendencia_formatada = None  # Deixa como None caso não haja uma data válida                            
                        
                        dt_hr_encerramento_pendencia = item.get('dt_hr_encerramento_pendencia')
                        if dt_hr_encerramento_pendencia and dt_hr_encerramento_pendencia.strip():
                            dt_hr_encerramento_pendencia_obj = datetime.strptime(dt_hr_encerramento_pendencia, "%d/%m/%Y %H:%M")
                            dt_hr_encerramento_pendencia_formatada = make_aware(dt_hr_encerramento_pendencia_obj)
                        else:
                            dt_hr_encerramento_pendencia_formatada = None  # Deixa como None caso não haja uma data válida                            

                        if id_pendencia_item in [None, "None", ''] or id_pendencia_item.startswith("novo_"):  # Criar novo registro
                            pendencia_item = Pendencia_Item.objects.create(
                                id_pendencia=pendencia,
                                id_tipo_pendencia=tp_pendencia,
                                dt_hr_inicio=dt_hr_inicio_pendencia_formatada,
                                dt_hr_encerramento=dt_hr_encerramento_pendencia_formatada,
                                dt_hr_criacao=now(),
                                id_usuario_criacao=obterUsuarioLogado(request),
                                id_usuario_alteracao=obterUsuarioLogado(request), 
                            )                               
                        else:  # Atualizar ou criar se ID existir
                            try:
                                pendencia_item = Pendencia_Item.objects.get(id=id_pendencia_item)
                                
                                pendencia_item.id_pendencia=pendencia
                                pendencia_item.id_tipo_pendencia=tp_pendencia
                                pendencia_item.dt_hr_inicio=dt_hr_inicio_pendencia_formatada
                                pendencia_item.dt_hr_encerramento=dt_hr_encerramento_pendencia_formatada
                                pendencia_item.id_usuario_criacao=obterUsuarioLogado(request)
                                pendencia_item.id_usuario_alteracao=obterUsuarioLogado(request)
                                                                
                                pendencia_item.save()                        
                            except Exception as e:
                                return JsonResponse({'success': False, 'message': str(e)})
                                
                        #Acompanhamentos da pendência
                        for acompanhamento_item in acompanhamentos_itens:
                            status = acompanhamento_item.get('status')
                            id_pendencia_item_do_acompanhamneto = acompanhamento_item.get('id_pendencia_item')

                            if status == c_Adicionar and id_pendencia_item_do_acompanhamneto == id_pendencia_item:
                                id_pendencia_item_acompanhamento = acompanhamento_item.get('id_pendencia_item_acompanhamento')
                                usuario_acompanhamento = acompanhamento_item.get('usuario_acompanhamento')
                                descricao_acompanhamento = acompanhamento_item.get('descricao_acompanhamento')

                                dt_hr_acompanhamento = acompanhamento_item.get('dt_hr_acompanhamento')
                                if dt_hr_acompanhamento and dt_hr_acompanhamento.strip():
                                    dt_hr_acompanhamento_obj = datetime.strptime(dt_hr_acompanhamento, "%d/%m/%Y %H:%M:%S")
                                    dt_hr_acompanhamento_formatada = make_aware(dt_hr_acompanhamento_obj)
                                else:
                                    dt_hr_acompanhamento_formatada = None  # Deixa como None caso não haja uma data válida                            

                                pendencia_item_acompanhamento = Pendencia_Item_Acompanhamento.objects.create(
                                    id_pendencia_item=pendencia_item,
                                    descricao=descricao_acompanhamento,
                                    id_usuario_criacao=obterUsuarioLogado(request),
                                    dt_hr_criacao=dt_hr_acompanhamento_formatada,
                                    id_usuario_alteracao=obterUsuarioLogado(request),                                            
                                )

                    return JsonResponse({'success': True, 'id': pendencia.id})
                
                except Exception as e:
                    return JsonResponse({'success': False, 'message': str(e)})
                    

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

def obter_pendencia_acompanhamentos(request, id_pendencia_item):
    """
    Retorna os acompanhamentos de um id_pendencia_item em formato JSON.
    """
    try:
        acompanhamentos = Pendencia_Item_Acompanhamento.objects.filter(id_pendencia_item=id_pendencia_item).order_by('-dt_hr_alteracao')
        
        data = [
            {
                "id_pendencia_item"         : acompanhamento.id_pendencia_item.id,
                "id"                        : acompanhamento.id,
                "dt_hr_acompanhamento"      : acompanhamento.dt_hr_alteracao.strftime("%d/%m/%Y %H:%M"),
                "usuario_acompanhamento"    : acompanhamento.id_usuario_alteracao,
                "descricao_acompanhamento"  : acompanhamento.descricao,
                "status"                    : c_Gravado,
            }
            for acompanhamento in acompanhamentos
        ]

        return JsonResponse({"acompanhamentos": data}, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
def carregar_dados(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
    
    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    estabelecimentos = Estabelecimento.objects.all().order_by('nome')
      
    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : 'Carregar dados',
        "apelido"               : obterApelidoUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "grupos"                : c_Grupos_de_Subgrupos,
        "estabelecimentos"      : estabelecimentos,
    }

    return render(request, "carregar_dados.html", contexto)    
    
def buscar_dados_mv(cursor, pendencia: "Pendencia") -> tuple["Pendencia", str, str, str, str, str, str,bool]:
    paciente_nome = dt_nascimento = nome_mae = str_erro = ''
    nr_cnes = pendencia.id_estabelecimento.cnes
    nr_atendimento_mv = pendencia.nr_atendimento_mv
    
    try:
        cursor.execute(sql_select_atendimento, {'cd_atendimento': nr_atendimento_mv, 'nr_cnes': nr_cnes})
        cursor.rowfactory = lambda *args: dict(zip([d[0].lower() for d in cursor.description], args))
        row = cursor.fetchone()
    except Exception as e:
        error, = e.args
        str_erro = f'Erro ao buscar o atendimento no MV - {error} - {str(e)}'  # Captura a descrição do erro
        return None, None, None, None, str_erro, None, None, False

    if row:
        paciente_nome                       = row['nm_paciente']
        nr_cpf                              = row['nr_cpf']
        nr_cns                              = row['nr_cns']
        dt_nascimento                       = row['dt_nascimento']
        nome_mae                            = row['nm_mae']
        
        pendencia.nr_paciente_mv            = row['cd_paciente']
        pendencia.municipio_mv              = row['nm_cidade']
        pendencia.uf_mv                     = row['cd_uf']
        pendencia.estabelecimento_mv        = row['nm_estabelecimento']
        pendencia.unidade_mv                = row['unidade']        
        dt_hr_admissao_hospitalar           = row['dt_admissao']
        pendencia.dt_previsao_alta          = row['dt_previsao_alta']
        pendencia.dt_hr_alta_medica         = row['dt_alta_medica']
        pendencia.dt_hr_alta_hospitalar     = row['dt_alta'] 

        dt_hr_admissao_hospitalar = dt_hr_admissao_hospitalar.strip("'\"")  
        dt_hr_admissao_hospitalar = datetime.strptime(dt_hr_admissao_hospitalar, "%d/%m/%Y %H:%M")
        pendencia.dt_hr_admissao_hospitalar = dt_hr_admissao_hospitalar

        if nr_cpf:
            nr_cpf = str(nr_cpf).zfill(11)            
    else:
        str_erro = 'Atendimento não encontrado no MV'
        return None, None, None, None, str_erro, None, None, False

    return pendencia, paciente_nome, dt_nascimento, nome_mae, str_erro, nr_cpf, nr_cns, True


def buscar_dados_mv_em_lotes(cursor, nr_atendimentos: set, nr_cnes: str) -> dict[int, dict]:
    """
    Divide os atendimentos em lotes de até 1000 e executa consultas em partes.
    Retorna todos os resultados em um único dicionário.
    """
    from math import ceil

    lista_ids = list(nr_atendimentos)
    tamanho_lote = 1000
    total_lotes = ceil(len(lista_ids) / tamanho_lote)

    dados_mv = {}

    for i in range(total_lotes):
        lote_ids = lista_ids[i * tamanho_lote:(i + 1) * tamanho_lote]
        placeholders = ', '.join(f':id_{j}' for j in range(len(lote_ids)))
        sql = sql_select_atendimentos.replace(':lista_ids', placeholders)
        params = {f'id_{j}': v for j, v in enumerate(lote_ids)}
        params['nr_cnes'] = nr_cnes

        try:
            cursor.execute(sql, params)
            colunas = [d[0].lower() for d in cursor.description]
            for row in cursor.fetchall():
                linha = dict(zip(colunas, row))
                cd_atendimento = linha['cd_atendimento']
                dados_mv[cd_atendimento] = linha
        except Exception as e:
            print(f"Erro no lote {i + 1}/{total_lotes}: {e}")
            continue

    return dados_mv



def registrar_erro(row, erros, mensagem_erro) -> bool:
    # Converte a linha para dicionário e adiciona o erro
    row_dict = row.to_dict()
    row_dict["Erro"] = mensagem_erro
    erros.append(row_dict)
    return False

def conectar_mv(nr_cnes):
    # Definindo os dados de conexão com base no número do CNES
    if nr_cnes == '2550687':
        #HRAS 
        dsn = cx_Oracle.makedsn('10.189.192.200', '1521', service_name='MVPROD')
        user = 'dbamv'
        password = 'soulmv_2010'
    elif nr_cnes == '2446030':
        #HMSA
        dsn = cx_Oracle.makedsn('10.189.196.200', '1521', service_name='HSA')
        user = 'dbamv'
        password = 'souldbamvhesa'
    elif nr_cnes == '2465752':
        #HEAC
        dsn = cx_Oracle.makedsn('10.243.54.200', '1521', service_name='SERVHEACPRD')
        user = 'dbamv'
        password = 'heacmv2010'
    elif nr_cnes == '7530706' or nr_cnes == '0011800':
        #HESVV e HINSG
        dsn = cx_Oracle.makedsn('10.4.1.51', '1521', service_name='MVSISSPRD')
        user = 'mvsiss'
        password = 'dbmv11g'
    else:
        return None, 'CNES não reconhecido para conexão MV'

    try:
        connection = cx_Oracle.connect(
            user=user,
            password=password,
            dsn=dsn
        )
    except cx_Oracle.DatabaseError as e:
        error, = e.args  # Obtém o primeiro item do tuple de args, que contém o erro
        str_erro = f'Erro de conexão com o banco do MV - {error.message if hasattr(error, "message") else str(error)}'
        return None, str_erro
    except cx_Oracle.InterfaceError as e:
        error, = e.args
        str_erro = f'Erro de interface com o MV - {error.message if hasattr(error, "message") else str(error)}'
        return None, str_erro
    except Exception as e:
        str_erro = f'Erro inesperado ao conectar com MV - {str(e)}'  # Captura a descrição do erro
        return None, str_erro

    return connection, 'Conectado!'    

def executar_carga(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == "POST":
        usuario_migracao = Usuario.objects.get(id_pessoa__nome='Migração',ativo=True)

        estabelecimento_id = request.POST.get('estabelecimento')
        estabelecimento = Estabelecimento.objects.get(id=estabelecimento_id)
        excluir_dados_existentes = request.POST.get('excluir_dados_existentes')
        arquivo_entrada = request.FILES.get('arquivo_entrada')
 
        # Processamento do arquivo Excel de entrada
        if arquivo_entrada:
            file_path = None
            try:
                file_path = default_storage.save(arquivo_entrada.name, arquivo_entrada)
                df = pd.read_excel(file_path)
            except Exception as e:
                return JsonResponse({'status': 'error', 'message': f'Erro na leitura do arquivo de entrada! Carga não realizada. Erro: {str(e)}'})
            finally:
                if file_path and default_storage.exists(file_path):
                    default_storage.delete(file_path)

            #Preparando lista de números de atendimentos para busca única no MV
            nr_atendimentos = set(df['Atendimento'].dropna().astype(int))

            pendencias = []
            pendencias_comanejo = []
            pendencias_itens = []
            pendencia_map = {}
            erros = []

            try:
                connection, str_erro = conectar_mv(estabelecimento.cnes)  
                if connection is None:
                    return JsonResponse({'status': 'error', 'message': f'Erro de conexão com o banco de dados! Carga não realizada. Erro: {str_erro}'})
                cursor = connection.cursor()
                #Busca do MV todos os dados dos atendimentos 
                dados_mv_dict = buscar_dados_mv_em_lotes(cursor, nr_atendimentos, estabelecimento.cnes)
                cursor.close()
                connection.close()                

                for index, row in df.iterrows():
                    motivo_da_admissao = cuidados_paliativos = motivo_saida = None
                    especialidade_comanejo = especialidade_pendencia_Item = None
                    data_admissao_comanejo = None

                    pendencia_sem_erro = True

                    pendencia = Pendencia(
                        id_estabelecimento=estabelecimento,
                        id_usuario_criacao=usuario_migracao,
                        id_usuario_alteracao=usuario_migracao,
                        dt_hr_criacao=now()
                    )
                    pendencia_Comanejo = None
                    pendencia_Item = None

                    for column_name, cell_value in row.items():
                        match column_name:
                            ##### Atendimento - Início #####
                            case 'Atendimento': 
                                if pd.isna(cell_value) or str(cell_value).lower() == "nan":
                                    pendencia_sem_erro = registrar_erro(row, erros, "Valor de Atendimento inválido ou nulo.")
                                    break

                                str_erro = ''
                                pendencia.nr_atendimento_mv = cell_value
                                pendencia.id_estabelecimento = estabelecimento

                                #pendencia, nome_paciente, data_nascimento, nome_da_mae, str_erro, nr_cpf, nr_cns, pendencia_sem_erro = buscar_dados_mv(cursor,pendencia)
                                #Obtém os dados do atendimento da memória
                                dados_mv = dados_mv_dict.get(pendencia.nr_atendimento_mv)

                                if dados_mv is not None:
                                    nome_paciente                       = dados_mv['nm_paciente']
                                    nr_cpf                              = dados_mv['nr_cpf']
                                    nr_cns                              = dados_mv['nr_cns']
                                    data_nascimento                     = dados_mv['dt_nascimento']
                                    nome_da_mae                         = dados_mv['nm_mae']
                                    
                                    pendencia.nr_paciente_mv            = dados_mv['cd_paciente']
                                    pendencia.municipio_mv              = dados_mv['nm_cidade']
                                    pendencia.uf_mv                     = dados_mv['cd_uf']
                                    pendencia.estabelecimento_mv        = dados_mv['nm_estabelecimento']
                                    pendencia.unidade_mv                = dados_mv['unidade']        
                                    dt_hr_admissao_hospitalar           = dados_mv['dt_admissao']
                                    #pendencia.dt_previsao_alta          = dados_mv['dt_previsao_alta']
                                    #pendencia.dt_hr_alta_medica         = dados_mv['dt_alta_medica']
                                    #pendencia.dt_hr_alta_hospitalar     = dados_mv['dt_alta'] 

                                    dt_hr_admissao_hospitalar = dt_hr_admissao_hospitalar.strip("'\"")  
                                    dt_hr_admissao_hospitalar = datetime.strptime(dt_hr_admissao_hospitalar, "%d/%m/%Y %H:%M")
                                    pendencia.dt_hr_admissao_hospitalar = dt_hr_admissao_hospitalar

                                    if nr_cpf:
                                        nr_cpf = str(nr_cpf).zfill(11)            

                                    if str_erro == '':
                                        #Dados do paciente
                                        paciente, criado = Paciente.objects.get_or_create(
                                                                nome=nome_paciente,
                                                                nr_cpf=nr_cpf,
                                                                nr_cns=nr_cns,
                                                                nome_mae=nome_da_mae,
                                                                dt_nascimento=datetime.strptime(data_nascimento, "%d/%m/%Y").date(),
                                                                defaults={  
                                                                    "id_usuario_alteracao": usuario_migracao,
                                                                }
                                                            )

                                        pendencia.id_paciente = paciente
                                    else:
                                        str_erro = f'Atendimento {cell_value} não encontrado no MV'
                                        pendencia_sem_erro = registrar_erro(row, erros, str_erro)
                                        break                                

                                else:
                                    pendencia_sem_erro = registrar_erro(row, erros, str_erro)
                                    break                                

                            case 'Motivo_da_Admissao':
                                if pd.isna(cell_value) or str(cell_value).lower() == "nan":
                                    pendencia_sem_erro = registrar_erro(row, erros, "Valor de Motivo_da_Admissao inválido ou nulo.")
                                    break

                                try:
                                    motivo_da_admissao = Subgrupo.objects.get(grupo=c_Motivo_Admissao, conteudo__iexact=cell_value, ativo=True)
                                    pendencia.id_motivo_admissao = motivo_da_admissao
                                except Exception as e:
                                    pendencia_sem_erro = registrar_erro(row, erros, f"Motivo da admissão '{cell_value}' não encontrado.")
                                    break
                                                                            
                            case 'Escore_de_Charlson':
                                try:
                                    if pd.notna(cell_value) and str(cell_value).lower() != "nan":
                                        numeric_value = float(cell_value)
                                        if numeric_value <= 37:
                                            pendencia.score_charlson = cell_value
                                        else:
                                            pendencia_sem_erro = registrar_erro(row, erros, f"Escore de Charlson '{cell_value}' inválido.")
                                            break    
                                except Exception as e:
                                    pendencia_sem_erro = registrar_erro(row, erros, f"Escore de Charlson '{cell_value}' inválido.")
                                    break

                            case 'Cuidados_paliativos':
                                if pd.isna(cell_value) or str(cell_value).lower() == "nan":
                                    pendencia_sem_erro = registrar_erro(row, erros, "Valor de Cuidados_paliativos inválido ou nulo.")
                                    break

                                try:
                                    cuidados_paliativos = Subgrupo.objects.get(grupo=c_Cuidados_Paliativos, conteudo__iexact=cell_value, ativo=True)
                                    pendencia.id_cuidados_paliativos = cuidados_paliativos
                                except Exception as e:
                                    pendencia_sem_erro = registrar_erro(row, erros, f"Cuidados paliativos '{cell_value}' não encontrada.")
                                    break
                                                                        
                            case 'Data_Hora_admissao_na_MH':
                                try:
                                    if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):        
                                        pendencia_sem_erro = registrar_erro(row, erros, "Valor de Data_Hora_admissao_na_MH inválido ou nulo.")
                                        break

                                    if not isinstance(cell_value, pd.Timestamp):
                                        pendencia.dt_hr_admissao_MH = datetime.strptime(cell_value, "%d/%m/%Y %H:%M")
                                    else:
                                        pendencia.dt_hr_admissao_MH = cell_value
                                except Exception as e:
                                    pendencia_sem_erro = registrar_erro(row, erros, f"Data/Hora de admissão na MH '{cell_value}' inválida.")
                                    break
                                    
                            case 'Previsao_de_alta':
                                try:
                                    if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):
                                        cell_value = None
                                    elif pd.isna(cell_value) or str(cell_value).lower() == "nan":  
                                        cell_value = None

                                    if cell_value: 
                                        if not isinstance(cell_value, pd.Timestamp):
                                            try:
                                                cell_value = pd.to_datetime(cell_value, dayfirst=True).date()
                                            except Exception as e:
                                                str_erro = f"Erro ao converter Previsao_de_alta: {cell_value} - {e}"
                                                pendencia_sem_erro = registrar_erro(row, erros, str_erro)
                                                break

                                    pendencia.dt_previsao_alta_inicial = cell_value
                                    pendencia.dt_previsao_alta = cell_value
                                except Exception as e:
                                    pendencia_sem_erro = registrar_erro(row, erros, f"Previsão de alta '{cell_value}' inválida.")
                                    break
                                
                            case 'Motivo_da_saida':
                                if pd.isna(cell_value) or str(cell_value).lower() == "nan":
                                    pendencia_sem_erro = registrar_erro(row, erros, "Valor de Motivo_da_saida inválido ou nulo.")
                                    break

                                try:
                                    motivo_saida = Subgrupo.objects.get(grupo=c_Motivo_Saida, conteudo__iexact=cell_value, ativo=True)
                                    pendencia.id_motivo_saida = motivo_saida
                                except Exception as e:
                                    pendencia_sem_erro = registrar_erro(row, erros, f"Motivo de saída '{cell_value}' não encontrada.")
                                    break

                            case 'Data_Hora_alta_medica':
                                try:
                                    if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):
                                        pendencia.dt_hr_alta_medica = None
                                    else:
                                        if isinstance(cell_value, pd.Timestamp):
                                            cell_value = cell_value.strftime("%d/%m/%Y %H:%M")

                                        pendencia.dt_hr_alta_medica = datetime.strptime(cell_value, "%d/%m/%Y %H:%M")
                                except Exception as e:
                                    pendencia_sem_erro = registrar_erro(row, erros, f"Data/Hora de alta médica '{cell_value}' inválida.")
                                    break
                                
                            case 'Data_Hora_alta_hospitalar':
                                try:
                                    if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):
                                        pendencia.dt_hr_alta_hospitalar = None
                                    else:
                                        if isinstance(cell_value, pd.Timestamp):
                                            cell_value = cell_value.strftime("%d/%m/%Y %H:%M")

                                        pendencia.dt_hr_alta_hospitalar = datetime.strptime(cell_value, "%d/%m/%Y %H:%M")
                                except Exception as e:
                                    pendencia_sem_erro = registrar_erro(row, erros, f"Data/Hora de alta hospitalar '{cell_value}' inválida.")
                                    break
                            ##### Atendimento - Fim #####
                            
                            ##### Comanejo - Início #####
                            case 'Especialidade_comanejo':
                                if cell_value:
                                    try:
                                        if pd.isna(cell_value) or str(cell_value).lower() == "nan":  
                                            pendencia_Comanejo = None
                                            continue

                                        especialidade_comanejo = Subgrupo.objects.get(grupo=c_Comanejo_Cirurgico, conteudo__iexact=cell_value, ativo=True)
                                        if especialidade_comanejo and pendencia:
                                            pendencia_Comanejo = Pendencia_Comanejo(
                                                id_pendencia=pendencia,
                                                id_especialidade=especialidade_comanejo,
                                                id_usuario_alteracao=usuario_migracao
                                            )
                                        else:
                                            pendencia_sem_erro = registrar_erro(row, erros, f"Especialidade comanejo '{cell_value}' não encontrado.")
                                        
                                        pendencia.comanejo_sim_nao = True
                                    except Exception as e:
                                        pendencia_sem_erro = registrar_erro(row, erros, f"Especialidade comanejo '{cell_value}' não encontrado.")
                                        break
                                
                            case 'Data_admissao_comanejo':
                                if cell_value and especialidade_comanejo:
                                    try:
                                        if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):
                                            continue
                                        else:
                                            if isinstance(cell_value, pd.Timestamp):
                                                cell_value = cell_value.strftime("%Y-%m-%d")
                                                
                                        data_admissao_comanejo = pendencia_Comanejo.dt_admissao = cell_value
                                    except Exception as e:
                                        pendencia_sem_erro = registrar_erro(row, erros, f"Data de admissão comanejo '{cell_value}' inválida.")
                                        break
                                    
                                
                            case 'Data_saida_comanejo':
                                if cell_value and especialidade_comanejo:
                                    try:
                                        if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):
                                            continue
                                        else:
                                            if isinstance(cell_value, pd.Timestamp):
                                                cell_value = cell_value.strftime("%Y-%m-%d")

                                        pendencia_Comanejo.dt_saida = cell_value

                                        if data_admissao_comanejo > pendencia_Comanejo.dt_saida:
                                            pendencia_sem_erro = registrar_erro(row, erros, f"Data de admissão comanejo maior que a data de saída do comanejo.")
                                            break

                                    except Exception as e:
                                        pendencia_sem_erro = registrar_erro(row, erros, f"Data de saída comanejo '{cell_value}' inválida.")
                                        break
                                
                                #Salvar Comanejo
                                
                            ##### Comanejo - Fim #####
                            
                            ##### Pendência - Início #####
                            case 'Pendencia':
                                if pd.isna(cell_value) or str(cell_value).lower() == "nan":
                                    pendencia_Item = None
                                    #pendencia_sem_erro = registrar_erro(row, erros, "Valor de Pendencia inválido ou nulo.")
                                else:
                                    try:
                                        especialidade_pendencia_Item = Tipo_Pendencia.objects.filter(pendencia__iexact=cell_value, ativo=True).first()
                                        if especialidade_pendencia_Item and pendencia:                                    
                                            pendencia_Item = Pendencia_Item(
                                                id_pendencia=pendencia,
                                                id_tipo_pendencia=especialidade_pendencia_Item,
                                                id_usuario_criacao=usuario_migracao,
                                                id_usuario_alteracao=usuario_migracao
                                            )
                                        else:
                                            pendencia_sem_erro = registrar_erro(row, erros, f"Especialidade pendência '{cell_value}' não encontrada.")

                                    except Exception as e:
                                        pendencia_sem_erro = registrar_erro(row, erros, f"Especialidade pendência '{cell_value}' não encontrada.")
                                        break

                            case 'Data_Hora_da_pendencia':
                                if cell_value and pendencia_Item:
                                    try:
                                        if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):
                                            pendencia_Item.dt_hr_inicio = None
                                        else:
                                            if isinstance(cell_value, pd.Timestamp):
                                                cell_value = cell_value.strftime("%d/%m/%Y %H:%M")

                                            pendencia_Item.dt_hr_inicio = datetime.strptime(cell_value, "%d/%m/%Y %H:%M")
                                    except Exception as e:
                                        pendencia_sem_erro = registrar_erro(row, erros, f"Data/Hora da pendência '{cell_value}' inválida.")
                                        break

                            case 'Data_Hora_encerramento_pendencia':
                                if cell_value and pendencia_Item:
                                    try:
                                        if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):
                                            pendencia_Item.dt_hr_encerramento = None
                                        else:
                                            if isinstance(cell_value, pd.Timestamp):
                                                cell_value = cell_value.strftime("%d/%m/%Y %H:%M")

                                            pendencia_Item.dt_hr_encerramento = datetime.strptime(cell_value, "%d/%m/%Y %H:%M")
                                    except Exception as e:
                                        pendencia_sem_erro = registrar_erro(row, erros, f"Data/Hora encerramento da pendência '{cell_value}' inválida.")
                                        break

                    if pendencia_sem_erro:
                        pendencias.append(pendencia)
                        pendencia_map[pendencia.nr_atendimento_mv] = pendencia  #Guarda referência

                        if pendencia_Comanejo:
                            pendencias_comanejo.append(pendencia_Comanejo)

                        if pendencia_Item:
                            pendencias_itens.append(pendencia_Item)             

            except Exception as e:       
                return JsonResponse({'status': 'error', 'message': 'Erro inesperado no processamento da carga de dados! Carga não realizada'})

            ### Exclusão dos dados existentes no banco de dados
            if excluir_dados_existentes == 'Sim':
                try:
                    Pendencia_Comanejo.objects.filter(
                        id_pendencia__id_estabelecimento=estabelecimento, 
                        id_usuario_alteracao=usuario_migracao
                    ).delete()            

                    Pendencia_Item.objects.filter(
                        id_pendencia__id_estabelecimento=estabelecimento, 
                        id_usuario_criacao=usuario_migracao
                    ).delete()            

                    Pendencia.objects.filter(
                        id_estabelecimento=estabelecimento, 
                        id_usuario_criacao=usuario_migracao
                    ).delete()            

                except IntegrityError as e:
                    msg_erro = f"Carga não efetuada. Erro de integridade: {e}"
                    return JsonResponse({'status': 'error', 'message': msg_erro})

                except DatabaseError as e:
                    msg_erro = f"Carga não efetuada. Erro no banco de dados: {e}"
                    return JsonResponse({'status': 'error', 'message': msg_erro})

                except Exception as e:
                    msg_erro = f"Carga não efetuada. Erro inesperado: {e}"
                    return JsonResponse({'status': 'error', 'message': msg_erro})

            try:
                with transaction.atomic():
                    Pendencia.objects.bulk_create(pendencias, batch_size=100)
                    Pendencia_Comanejo.objects.bulk_create(pendencias_comanejo, batch_size=100)
                    Pendencia_Item.objects.bulk_create(pendencias_itens, batch_size=100)
            except IntegrityError as e:
                # Violação de integridade (ex: chave estrangeira, unique, etc)
                str_erro = f"Erro de integridade: {e}"
            except DataError as e:
                # Dados inválidos (string muito longa, etc)
                str_erro = f"Erro de dados: {e}"
            except OperationalError as e:
                # Problemas operacionais (conexão, etc)
                str_erro = f"Erro operacional: {e}"
            except DatabaseError as e:
                # Outros erros do banco
                str_erro = f"Erro de banco de dados: {e}"
            except Exception as e:
                str_erro = f"Erro inesperado: {e}"

        #Se houver erros, salvar em um novo Excel para reprocessamento
        if erros:
            erro_df = pd.DataFrame(erros)

            # Identifica as colunas de data e formata para DD/MM/YYYY
            for col in erro_df.select_dtypes(include=['datetime64[ns]', 'object']).columns:
                if (col == 'Data_Hora_admissao_na_MH' or col == 'Data_Hora_alta_medica' or col == 'Data_Hora_alta_hospitalar' or
                    col == 'Data_Hora_da_pendencia'   or col == 'Data_Hora_encerramento_pendencia'):
                    erro_df[col] = erro_df[col].apply(
                        lambda x: x.strftime("%d/%m/%Y %H:%M") if isinstance(x, (pd.Timestamp, datetime)) and not pd.isna(x) else x
                    )                
                elif (col == 'Previsao_de_alta' or col == 'Data_admissao_comanejo' or col == 'Data_saida_comanejo'):
                    erro_df[col] = erro_df[col].apply(
                        lambda x: x.strftime("%d/%m/%Y") if isinstance(x, (pd.Timestamp, datetime)) and not pd.isna(x) else x
                    ) 

            arquivo_base, ext = os.path.splitext(arquivo_entrada.name)
            erro_file_path = os.path.join(default_storage.location, f"{arquivo_base}_erros{ext}")
            
            erro_df.to_excel(erro_file_path, index=False, engine='openpyxl')
            # Retornar o caminho do arquivo para que o usuário possa baixá-lo
            return JsonResponse({
                'status': 'parcial',
                'message': 'Carga concluída com erros!',
                'arquivo_erros': f"/download_erro/?file={arquivo_base}_erros.xlsx"
            })

        return JsonResponse({'status': 'sucesso', 'message': 'Dados carregados com sucesso!'})

def download_erro(request):
    file_name = request.GET.get("file")

    # Modifica o nome do arquivo se necessário
    nome_base, ext = os.path.splitext(file_name)
    if ext == '.xlsx' and '_erros' not in nome_base:
        # Se a extensão for .xlsx e não tiver o sufixo _erros, adicionar ao nome
        file_name = f"{nome_base}_erros{ext}"
    
    file_path = os.path.join(default_storage.location, file_name)

    if os.path.exists(file_path):
        # Abre o arquivo e prepara a resposta HTTP
        with open(file_path, "rb") as file:
            response = HttpResponse(file.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{file_name}"'

        # Após a resposta ser configurada, excluir o arquivo de erro
        default_storage.delete(file_path)  # Exclui o arquivo de erro
        
        return response
    else:
        return JsonResponse({'status': 'erro', 'message': 'Arquivo não encontrado'}, status=404)


def executar_carga_cid(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')
        
    if request.method == "POST":
        usuario_migracao = Usuario.objects.get(id_pessoa__nome='Migração',ativo=True)

        excluir_dados_existentes = request.POST.get('excluir_cids')
        arquivo_entrada_cid = request.FILES.get('arquivo_entrada_cid')

        try:
            if excluir_dados_existentes == 'Sim':
                CID.objects.delete()            

        except IntegrityError as e:
            msg_erro = f"Carga não efetuada. Erro de integridade: {e}"
            return JsonResponse({'status': 'error', 'message': msg_erro})

        except DatabaseError as e:
            msg_erro = f"Carga não efetuada. Erro no banco de dados: {e}"
            return JsonResponse({'status': 'error', 'message': msg_erro})

        except Exception as e:
            msg_erro = f"Carga não efetuada. Erro inesperado: {e}"
            return JsonResponse({'status': 'error', 'message': msg_erro})

        # Processamento do arquivo Excel de entrada
        if arquivo_entrada_cid:
            file_path = default_storage.save(arquivo_entrada_cid.name, arquivo_entrada_cid)
            df = pd.read_excel(file_path)

            erros = []

            for index, row in df.iterrows():
                sem_erro = True
                for column_name, cell_value in row.items():
                    try:
                        match column_name:
                            case 'codigo': 
                                if pd.isna(cell_value) or str(cell_value).lower() == "nan":
                                    sem_erro = registrar_erro(row, erros, "Valor de Cuidados_paliativos inválido ou nulo.")
                                    break
                                codigo = cell_value
                                                                        
                            case 'descricao':
                                if isinstance(cell_value, pd._libs.tslibs.nattype.NaTType):        
                                    sem_erro = registrar_erro(row, erros, "Valor de Data_Hora_admissao_na_MH inválido ou nulo.")
                                    break
                                descricao = cell_value
                                    
                    except Exception as e:
                        # Se der erro, adiciona a linha na lista de erros
                        sem_erro = registrar_erro(row, erros, str(e))
                        break

                if sem_erro:
                    with transaction.atomic():
                        try:
                            cid = CID(
                                codigo = codigo,
                                desc = descricao,
                                id_usuario_alteracao = usuario_migracao,
                            )
                            cid.save()

                        except IntegrityError as e:
                            str_erro = 'Erro de integridade: ' + str(e)
                            registrar_erro(row, erros, str_erro)
                        except ValidationError as e:
                            str_erro = 'Erro de validação: ' + str(e)
                            registrar_erro(row, erros, str_erro)
                        except DatabaseError as e:
                            str_erro = 'Erro de Banco de Dados: ' + str(e)
                            registrar_erro(row, erros, str_erro)
                        except Exception as e:
                            str_erro = 'Erro geral: ' + str(e)
                            registrar_erro(row, erros, str_erro)

            default_storage.delete(file_path) # Exclui no servidor o arquivo de entrada 
            
        #Se houver erros, salvar em um novo Excel para reprocessamento
        if erros:
            erro_df = pd.DataFrame(erros)

            arquivo_base, ext = os.path.splitext(arquivo_entrada_cid.name)
            erro_file_path = os.path.join(default_storage.location, f"{arquivo_base}_erros{ext}")
            
            erro_df.to_excel(erro_file_path, index=False, engine='openpyxl')
            # Retornar o caminho do arquivo para que o usuário possa baixá-lo
            return JsonResponse({
                'status': 'parcial',
                'message': 'Carga concluída com erros!',
                'arquivo_erros': f"/download_erro/?file={arquivo_base}_erros.xlsx"
            })

        return JsonResponse({'status': 'sucesso', 'message': 'Dados carregados com sucesso!'})


############################################################################
# 
#   Dashboards
# 
# ##########################################################################
# Conversão precisa para dias com até 2 casas decimais
def formatar_dias(duration):
    if duration:
        dias = Decimal(duration.total_seconds()) / Decimal(86400)
        dias_formatado = dias.quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
        return f"{str(dias_formatado).replace('.', ',')} dias"
    return "0 dias"

@csrf_exempt
def dashboard(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')

    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    estabelecimentos = Estabelecimento.objects.all().order_by('nome')
    tp_profissional = Subgrupo.objects.filter(grupo=c_Profissional, conteudo='Médico(a)').first()
    medicos = Profissional.objects.filter(ativo=True, id_tp_profissional=tp_profissional,id_estabelecimento=usuario_logado.id_estabelecimento).order_by('id_pessoa__nome')
    subgrupos = Subgrupo.objects.filter(ativo=True).order_by('grupo', 'conteudo')
    
    municipios = (
        Pendencia.objects
        #.filter(id_estabelecimento=usuario_logado.id_estabelecimento,municipio_mv__isnull=False)
        .filter(municipio_mv__isnull=False)
        .exclude(municipio_mv__exact='')
        .values_list('municipio_mv', flat=True)
        .distinct()
        .order_by('municipio_mv')
    )    

    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : '',
        "apelido"               : obterApelidoUsuario(request),
        "perfil_usuario"        : obterPerfilUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "grupos"                : c_Grupos_de_Subgrupos,
        "estabelecimentos"      : estabelecimentos,
        "municipios"            : municipios,
        "subgrupos"             : subgrupos,
        "medicos"               : medicos,
    }    
    
    return render(request, "dashboard.html", contexto)

def dashboard2(request):
    if 'access_token' not in request.session:
        return redirect('autenticacao')

    usuario_logado = obterUsuarioLogado(request)
    sigla_estabelecimento = obterSiglaEstabelecimento(request)    
    estabelecimentos = Estabelecimento.objects.all().order_by('nome')
    tp_profissional = Subgrupo.objects.filter(grupo=c_Profissional, conteudo='Médico(a)').first()
    medicos = Profissional.objects.filter(ativo=True, id_tp_profissional=tp_profissional,id_estabelecimento=usuario_logado.id_estabelecimento).order_by('id_pessoa__nome')
    subgrupos = Subgrupo.objects.filter(ativo=True).order_by('grupo', 'conteudo')
    
    municipios = (
        Pendencia.objects
        #.filter(id_estabelecimento=usuario_logado.id_estabelecimento,municipio_mv__isnull=False)
        .filter(municipio_mv__isnull=False)
        .exclude(municipio_mv__exact='')
        .values_list('municipio_mv', flat=True)
        .distinct()
        .order_by('municipio_mv')
    )    

    contexto = {
        "titulo_01"             : titulo_app,
        "titulo_02"             : '',
        "apelido"               : obterApelidoUsuario(request),
        "perfil_usuario"        : obterPerfilUsuario(request),
        "perfis_usuario"        : c_lista_perfis_usuario,
        "perfil_usuario_logado" : usuario_logado.perfil,
        "sigla_estabelecimento" : sigla_estabelecimento,        
        "grupos"                : c_Grupos_de_Subgrupos,
        "estabelecimentos"      : estabelecimentos,
        "municipios"            : municipios,
        "subgrupos"             : subgrupos,
        "medicos"               : medicos,
    }    
    
    return render(request, "dashboard2.html", contexto)

def dashboard_altas_por_motivo_de_admissao(request):
    id_estabelecimento = request.GET.get("estabelecimento")
    periodo_de = request.GET.get("de")
    periodo_ate = request.GET.get("ate")

    try:
        # Corrige valores inválidos ou não enviados
        if not periodo_de or periodo_de == "undefined":
            periodo_de = now().date().strftime('%Y-%m-%d')

        if not periodo_ate or periodo_ate == "undefined":
            periodo_ate = (datetime.strptime(periodo_de, '%Y-%m-%d').date() - timedelta(days=30)).strftime('%Y-%m-%d')

        data_inicio_date = datetime.strptime(periodo_de, '%Y-%m-%d').date()
        data_fim_date = datetime.strptime(periodo_ate, '%Y-%m-%d').date()

        data_hr_inicio = datetime.combine(data_inicio_date, time.min)   # 00:00:00
        data_hr_fim = datetime.combine(data_fim_date, time.max)         # 23:59:59.999999
    except Exception as e:
        return JsonResponse({'error': 'Datas inválidas'}, status=400)

    try:
        estabelecimento = Estabelecimento.objects.get(id=id_estabelecimento)
    except Exception as e:
        estabelecimento = None

    filtro = Q(dt_hr_alta_medica__date__range=(data_hr_inicio, data_hr_fim))
    
    if estabelecimento:        
        filtro &= Q(id_estabelecimento=estabelecimento)
        
    dados = (Pendencia.objects.filter(filtro)
                .values('id_motivo_admissao__conteudo')
                #.values('id_cid__desc')
                .annotate(total=Count('id'))
                .order_by('-total'))        

    ##### Total de saídas conforme filtro solicitado ##### 
    total_saidas = Pendencia.objects.filter(filtro).count()

    ##### Total de admisões conforme filtro solicitado ##### 
    filtro_admissoes = Q(dt_hr_admissao_hospitalar__date__range=(data_hr_inicio, data_hr_fim))
    if estabelecimento:
        filtro_admissoes &= Q(id_estabelecimento=estabelecimento)

    total_admissoes = Pendencia.objects.filter(filtro_admissoes).count()

    ##### Tempo médio de permanência hospitalar conforme filtro solicitado ##### 
    tempo_hosp_query = (
    Pendencia.objects
        .filter(filtro, dt_hr_alta_hospitalar__isnull=False)
        .annotate(permanencia=ExpressionWrapper(F('dt_hr_alta_hospitalar') - F('dt_hr_admissao_hospitalar'), output_field=DurationField()))
        .aggregate(media=Avg('permanencia'))
    )

    tempo_permanencia_hospitalar = formatar_dias(tempo_hosp_query['media'])

    ##### TEMPO DE PERMANÊNCIA HOSPITALAR - MEDIANA
    permanencias_hospitalares = list(
        Pendencia.objects
            .filter(filtro, dt_hr_alta_hospitalar__isnull=False)
            .annotate(permanencia=ExpressionWrapper(
                F('dt_hr_alta_hospitalar') - F('dt_hr_admissao_hospitalar'),
                output_field=DurationField()
            ))
            .values_list('permanencia', flat=True)
    )

    if permanencias_hospitalares:
        median_permanencia_hosp = median([p.total_seconds() for p in permanencias_hospitalares]) / (60 * 60 * 24)
        tempo_permanencia_hospitalar_mediana = formatar_dias(timedelta(days=median_permanencia_hosp))
    else:
        tempo_permanencia_hospitalar_mediana = None

    ##### Tempo médio de permanência na MH conforme filtro solicitado ##### 
    tempo_mh_query = (
        Pendencia.objects
        .filter(filtro, dt_hr_alta_hospitalar__isnull=False)
        .annotate(permanencia=ExpressionWrapper(F('dt_hr_alta_hospitalar') - F('dt_hr_admissao_MH'), output_field=DurationField()))
        .aggregate(media=Avg('permanencia'))
    )

    tempo_permanencia_MH = formatar_dias(tempo_mh_query['media'])

    ##### TEMPO DE PERMANÊNCIA NA MH - MEDIANA
    permanencias_mh = list(
        Pendencia.objects
            .filter(filtro, dt_hr_alta_hospitalar__isnull=False)
            .annotate(permanencia=ExpressionWrapper(
                F('dt_hr_alta_hospitalar') - F('dt_hr_admissao_MH'),
                output_field=DurationField()
            ))
            .values_list('permanencia', flat=True)
    )

    if permanencias_mh:
        median_permanencia_mh = median([p.total_seconds() for p in permanencias_mh]) / (60 * 60 * 24)
        tempo_permanencia_MH_mediana = formatar_dias(timedelta(days=median_permanencia_mh))
    else:
        tempo_permanencia_MH_mediana = None    

    ##### Envio dos dados para o Chart.JS #####
    labels = [d['id_motivo_admissao__conteudo'] for d in dados]
    data = [d['total'] for d in dados]
    return JsonResponse({
        'labels': labels,
        'data': data,
        'total_admissoes': total_admissoes,
        'total_saidas': total_saidas,
        'tempo_permanencia_hospitalar': tempo_permanencia_hospitalar,
        'tempo_permanencia_hospitalar_mediana': tempo_permanencia_hospitalar_mediana,
        'tempo_permanencia_MH': tempo_permanencia_MH,
        'tempo_permanencia_MH_mediana': tempo_permanencia_MH_mediana,
    })

    

def dashboard_altas_por_hora(request):
    id_estabelecimento = request.GET.get("estabelecimento")
    id_profissional = request.GET.get("profissional")
    data_inicio = request.GET.get('de')
    data_fim = request.GET.get('ate')
    
    if id_estabelecimento:
        estabelecimento = Estabelecimento.objects.get(id=id_estabelecimento)
        pendencias = Pendencia.objects.filter(id_estabelecimento=estabelecimento)
    else:
        pendencias = Pendencia.objects.all()
        
    if data_inicio and data_fim:
        dt_inicio = datetime.strptime(data_inicio, "%Y-%m-%d")
        dt_fim = datetime.strptime(data_fim, "%Y-%m-%d")
        if id_profissional == "":
            pendencias = pendencias.filter(dt_hr_alta_medica__date__range=(dt_inicio, dt_fim))
        else:
            medico = Profissional.objects.get(id=id_profissional)
            pendencias = pendencias.filter(dt_hr_alta_medica__date__range=(dt_inicio, dt_fim), id_medico=medico)

    # --- Altas por hora (para o gráfico)
    por_hora = (
        pendencias.annotate(hora=ExtractHour('dt_hr_alta_medica'))
        .values('hora')
        .annotate(total=Count('id'))
    )

    horas_dict = {h: 0 for h in range(24)}
    for d in por_hora:
        horas_dict[d['hora']] = d['total']

    labels = [f"{h:02d}h" for h in range(24)]
    data = [horas_dict[h] for h in range(24)]

    # --- Média por dia (linha horizontal)
    por_dia = (
        pendencias.annotate(data=TruncDate('dt_hr_alta_medica'))
        .values('data')
        .annotate(total=Count('id'))
    )
    totais_dias = [d['total'] for d in por_dia]
    media_diaria = sum(totais_dias) / len(totais_dias) if totais_dias else 0

    # --- Total de altas até 10h - dt_hr_alta_medica < 11hrs
    total_ate_10h = pendencias.filter(dt_hr_alta_medica__hour__lt=11).count()

    # --- Total geral no período
    total_geral = pendencias.count()

    # --- Percentual até 10h
    percentual_ate_10h = (total_ate_10h / total_geral * 100) if total_geral else 0

    # --- Último semestre
    seis_meses_atras = now() - timedelta(days=180)
    pendencias_ultimo_semestre = Pendencia.objects.filter(dt_hr_alta_medica__gte=seis_meses_atras)

    total_ultimo_semestre = pendencias_ultimo_semestre.count()
    total_ate_10h_ultimo_semestre = pendencias_ultimo_semestre.filter(dt_hr_alta_medica__hour__lt=10).count()
    percentual_ate_10h_ultimo_semestre = 0
    percentual_ate_10h_ultimo_semestre = (total_ate_10h_ultimo_semestre / total_ultimo_semestre * 100) if total_ultimo_semestre else 0

    return JsonResponse({
        'labels': labels,
        'data': data,
        'media_diaria': media_diaria,
        'total_ate_10h': total_ate_10h,
        'percentual_ate_10h': round(percentual_ate_10h, 2),
        'percentual_ate_10h_ultimo_semestre': round(percentual_ate_10h_ultimo_semestre, 2)
    })

def dashboard_longa_permanecia(request):
    # --- 1. Parâmetros --------------------------------------------------
    id_estabelecimento = request.GET.get("estabelecimento")
    id_cuidados_paliativos = request.GET.get("cuidados_paliativos")
    id_comanejo_cirurgico = request.GET.get("comanejo_cirurgico")
    
    data_inicio_str = request.GET.get("de")
    data_fim_str = request.GET.get("ate")

    try:
        data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date() if data_inicio_str else None
        data_fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date() if data_fim_str else None
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    # --- 2. Query base --------------------------------------------------
    pendencias = Pendencia.objects.annotate(
        duracao_internacao=ExpressionWrapper(
            F("dt_hr_alta_hospitalar") - F("dt_hr_admissao_hospitalar"),
            output_field=DurationField()
        )
    )

    if data_inicio and data_fim:
        pendencias = pendencias.filter(
            dt_hr_alta_hospitalar__date__range=(data_inicio, data_fim),
            duracao_internacao__gt=timedelta(days=15)
        )
    else:
        pendencias = pendencias.none()

    # --- 3. Filtros adicionais ------------------------------------------
    if id_estabelecimento:
        pendencias = pendencias.filter(id_estabelecimento=id_estabelecimento)

    if id_cuidados_paliativos:
        try:
            cuidados_paliativos = Subgrupo.objects.get(id=id_cuidados_paliativos)
            if cuidados_paliativos.conteudo == "Sim":
                cuidados_paliativos_nao = Subgrupo.objects.filter(
                    grupo=c_Cuidados_Paliativos, conteudo="Não"
                ).first()
                if cuidados_paliativos_nao:
                    pendencias = pendencias.exclude(id_cuidados_paliativos=cuidados_paliativos_nao)
            else:
                pendencias = pendencias.filter(id_cuidados_paliativos=cuidados_paliativos)
        except Subgrupo.DoesNotExist:
            pass

    if id_comanejo_cirurgico:
        pendencia_comanejo_exists = Pendencia_Comanejo.objects.filter(
            id_pendencia=OuterRef("pk")
        )
        if id_comanejo_cirurgico == "Sim":
            pendencias = pendencias.filter(Exists(pendencia_comanejo_exists))
        elif id_comanejo_cirurgico == "Não":
            pendencias = pendencias.exclude(Exists(pendencia_comanejo_exists))

    # --- 4. Longas por mês ----------------------------------------------
    longas_por_mes = pendencias.annotate(
        mes=ExtractMonth("dt_hr_alta_hospitalar"),
        ano=ExtractYear("dt_hr_alta_hospitalar")
    ).values("mes", "ano").annotate(
        total=Count("id")
    ).order_by("ano", "mes")

    labels = [f"{d['mes']:02d}/{d['ano']}" for d in longas_por_mes]
    data = [d["total"] for d in longas_por_mes]

    # --- 5. Tabela de atendimentos --------------------------------------
    atendimentos = list(pendencias.annotate(
        duracao=ExpressionWrapper(
            F("dt_hr_alta_hospitalar") - F("dt_hr_admissao_hospitalar"),
            output_field=DurationField()
        ),
        duracao_dias=ExtractDay(
            ExpressionWrapper(
                F("dt_hr_alta_hospitalar") - F("dt_hr_admissao_hospitalar"),
                output_field=DurationField()
            )
        )
    ).values("id", "nr_atendimento_mv", "duracao_dias"))

    atendimentos = sorted(atendimentos, key=lambda x: x["duracao_dias"] or 0, reverse=True)

    # --- 6. Gráfico de desfechos ----------------------------------------
    desfechos = pendencias.values("id_motivo_saida__conteudo").annotate(
        total=Count("id")
    ).order_by("-total")

    labels_desfechos = [d["id_motivo_saida__conteudo"] for d in desfechos]
    data_desfechos = [d["total"] for d in desfechos]

    # --- 7. Gráfico de patologias ---------------------------------------
    patologias = pendencias.values("id_motivo_admissao__conteudo").annotate(
        total=Count("id")
    ).order_by("-total")[:5]

    labels_patologias = [p["id_motivo_admissao__conteudo"] for p in patologias]
    data_patologias = [p["total"] for p in patologias]

    # --- 8. Resposta JSON -----------------------------------------------
    return JsonResponse({
        "labels": labels,
        "data": data,
        "atendimentos": atendimentos,
        "labels_desfechos": labels_desfechos,
        "data_desfechos": data_desfechos,
        "labels_patologias": labels_patologias,
        "data_patologias": data_patologias,
    })

def dashboard_admissoes_e_saidas(request):
    id_estabelecimento = request.GET.get("estabelecimento")
    data_inicio_str = request.GET.get("de")
    data_fim_str = request.GET.get("ate")

    try:
        data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date() if data_inicio_str else None
        data_fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date() if data_fim_str else None
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    pendencias = Pendencia.objects.all()

    if id_estabelecimento:
        pendencias = pendencias.filter(id_estabelecimento=id_estabelecimento)

    if data_inicio and data_fim:
        admissoes = pendencias.filter(dt_hr_admissao_hospitalar__date__range=(data_inicio, data_fim))
        altas = pendencias.filter(dt_hr_alta_hospitalar__date__range=(data_inicio, data_fim))
    else:
        admissoes = pendencias.none()
        altas = pendencias.none()

    def agrupar_por_mes(queryset, campo):
        return queryset.annotate(
            mes=ExtractMonth(campo),
            ano=ExtractYear(campo)
        ).values("mes", "ano").annotate(
            total=Count("id")
        ).order_by("ano", "mes")

    admissoes_mes = agrupar_por_mes(admissoes, "dt_hr_admissao_hospitalar")
    altas_mes = agrupar_por_mes(altas, "dt_hr_alta_hospitalar")

    todos_meses = defaultdict(lambda: {"admissoes": 0, "altas": 0})

    for a in admissoes_mes:
        chave = f"{a['mes']:02d}/{a['ano']}"
        todos_meses[chave]["admissoes"] = a["total"]

    for a in altas_mes:
        chave = f"{a['mes']:02d}/{a['ano']}"
        todos_meses[chave]["altas"] = a["total"]

    labels_ordenados = sorted(todos_meses.keys(), key=lambda x: (int(x.split("/")[1]), int(x.split("/")[0])))
    admissoes_data = [todos_meses[l]["admissoes"] for l in labels_ordenados]
    altas_data = [todos_meses[l]["altas"] for l in labels_ordenados]

    # Origem do Paciente
    origem_data = admissoes.values(
        conteudo=F("id_origem_paciente__conteudo")
    ).annotate(
        total=Count("id")
    ).order_by("-total")

    total_admissoes = sum(o["total"] for o in origem_data) or 1

    origem_labels = [o["conteudo"] for o in origem_data]
    origem_percentuais = [round(o["total"] / total_admissoes * 100, 2) for o in origem_data]
    origem_absolutos = [o["total"] for o in origem_data]

    # Motivo de Saída
    motivo_data = altas.values(
        conteudo=F("id_motivo_saida__conteudo")
    ).annotate(
        total=Count("id")
    ).order_by("-total")

    total_altas = sum(m["total"] for m in motivo_data) or 1

    motivo_labels = [m["conteudo"] for m in motivo_data]
    motivo_percentuais = [round(m["total"] / total_altas * 100, 2) for m in motivo_data]
    motivo_absolutos = [m["total"] for m in motivo_data]

    # Município x Total de atendimentos
    municipios_total_data = admissoes.values("municipio_mv").annotate(
        total=Count("id")
    ).order_by("-total")

    municipios_labels = [m["municipio_mv"] or "Não informado" for m in municipios_total_data]
    municipios_values = [m["total"] for m in municipios_total_data]

    return JsonResponse({
        "labels": labels_ordenados,
        "admissoes": admissoes_data,
        "altas": altas_data,
        "origem_labels": origem_labels,
        "origem_percentuais": origem_percentuais,
        "origem_absolutos": origem_absolutos,
        "motivo_labels": motivo_labels,
        "motivo_percentuais": motivo_percentuais,
        "motivo_absolutos": motivo_absolutos,
        "municipios_labels": municipios_labels,
        "municipios_values": municipios_values
    })

def dashboard_admissoes(request):
    # --- 1. Inputs -----------------------------------------------------
    id_estabelecimento = request.GET.get("estabelecimento")
    id_medico = request.GET.get("medico")
    id_comanejo_cirurgico = request.GET.get("comanejo")

    data_inicio_str = request.GET.get("de")
    data_fim_str = request.GET.get("ate")

    try:
        data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date() if data_inicio_str else None
        data_fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date() if data_fim_str else None
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    pendencias = Pendencia.objects.all()

    if data_inicio and data_fim:
        pendencias = pendencias.filter(dt_hr_admissao_hospitalar__date__range=(data_inicio, data_fim))
    if id_estabelecimento:
        pendencias = pendencias.filter(id_estabelecimento=id_estabelecimento)
    if id_medico:
        pendencias = pendencias.filter(id_medico=id_medico)
    if id_comanejo_cirurgico in {"Sim", "Não"}:
        subq = Pendencia_Comanejo.objects.filter(id_pendencia=OuterRef("pk"))
        pendencias = pendencias.filter(Exists(subq)) if id_comanejo_cirurgico == "Sim" else pendencias.exclude(Exists(subq))

    # --- 3. Agrupamento por mês ----------------------------------------
    admissoes_agrupadas = pendencias.annotate(
        mes=F("dt_hr_admissao_hospitalar__month"),
        ano=F("dt_hr_admissao_hospitalar__year")
    ).values("mes", "ano").annotate(
        total=Count("id")
    ).order_by("ano", "mes")

    labels = [f"{d['mes']:02d}/{d['ano']}" for d in admissoes_agrupadas]
    data = [d["total"] for d in admissoes_agrupadas]

    # --- 4. Motivos de admissão ----------------------------------------
    motivos_agrupados = pendencias.values("id_motivo_admissao__conteudo").annotate(
        total=Count("id")
    ).order_by("-total")[:10]

    total_admissoes = pendencias.count() or 1  # evita divisão por zero

    motivos_labels = [m["id_motivo_admissao__conteudo"] for m in motivos_agrupados]
    motivos_percentuais = [round(m["total"] / total_admissoes * 100, 1) for m in motivos_agrupados]
    motivos_absolutos = [m["total"] for m in motivos_agrupados]

    return JsonResponse({
        "labels": labels,
        "data": data,
        "motivo_labels": motivos_labels,
        "motivo_data": motivos_percentuais,
        "motivo_absolutos": motivos_absolutos,
    })

def dashboard_altas_dia_da_semana(request):
    id_estabelecimento = request.GET.get("estabelecimento")
    id_medico = request.GET.get("medico")
    comanejo = request.GET.get("comanejo")
    dia_especifico = request.GET.get("dia_semana")

    data_inicio_str = request.GET.get("de")
    data_fim_str = request.GET.get("ate")

    try:
        data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date() if data_inicio_str else None
        data_fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date() if data_fim_str else None
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    pendencias = Pendencia.objects.exclude(dt_hr_alta_hospitalar__isnull=True)

    if data_inicio:
        pendencias = pendencias.filter(dt_hr_alta_hospitalar__date__gte=data_inicio)
    if data_fim:
        pendencias = pendencias.filter(dt_hr_alta_hospitalar__date__lte=data_fim)

    if id_estabelecimento:
        pendencias = pendencias.filter(id_estabelecimento=id_estabelecimento)
    if id_medico:
        pendencias = pendencias.filter(id_medico=id_medico)

    if comanejo == "Sim":
        pendencias = pendencias.filter(tb_pendencia_comanejo_id_pendencia_fkey__isnull=False)
    elif comanejo == "Não":
        pendencias = pendencias.filter(tb_pendencia_comanejo_id_pendencia_fkey__isnull=True)

    dias_nome = {
        1: "Domingo", 2: "Segunda", 3: "Terça", 4: "Quarta",
        5: "Quinta", 6: "Sexta", 7: "Sábado"
    }

    dias_ordenados = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
    contagem = {dia: 0 for dia in dias_ordenados}

    pendencias_dia = pendencias.annotate(weekday=ExtractWeekDay("dt_hr_alta_hospitalar")).values("weekday").annotate(total=Count("id"))
    for item in pendencias_dia:
        nome_dia = dias_nome[item["weekday"]]
        if nome_dia in contagem:
            contagem[nome_dia] += item["total"]

    # Filtro adicional por dia da semana selecionado
    if dia_especifico:
        contagem = {dia: (contagem[dia] if dia == dia_especifico else 0) for dia in dias_ordenados}

    dados_dias = [contagem[d] for d in dias_ordenados]
    total_altas = sum(dados_dias)

    altas_fim_de_semana = contagem["Sábado"] + contagem["Domingo"]
    percentual_fim_de_semana = round((altas_fim_de_semana / total_altas) * 100, 1) if total_altas else 0

    hoje = datetime.today().date()
    tres_meses_atras = hoje - timedelta(days=90)

    pendencias_trim = Pendencia.objects.exclude(dt_hr_alta_hospitalar__isnull=True)
    pendencias_trim = pendencias_trim.filter(dt_hr_alta_hospitalar__date__range=(tres_meses_atras, hoje))

    if id_estabelecimento:
        pendencias_trim = pendencias_trim.filter(id_estabelecimento=id_estabelecimento)
    if id_medico:
        pendencias_trim = pendencias_trim.filter(id_medico=id_medico)
    if comanejo == "Sim":
        pendencias_trim = pendencias_trim.filter(tb_pendencia_comanejo_id_pendencia_fkey__isnull=False)
    elif comanejo == "Não":
        pendencias_trim = pendencias_trim.filter(tb_pendencia_comanejo_id_pendencia_fkey__isnull=True)

    pendencias_trim = pendencias_trim.annotate(weekday=ExtractWeekDay("dt_hr_alta_hospitalar")).values("weekday").annotate(total=Count("id"))

    total_trim = 0
    fim_de_semana_trim = 0
    for item in pendencias_trim:
        total_trim += item["total"]
        if item["weekday"] in [1, 7]:  # 1 = Domingo, 7 = Sábado
            fim_de_semana_trim += item["total"]

    percentual_trim = round((fim_de_semana_trim / total_trim) * 100, 1) if total_trim else 0

    return JsonResponse({
        "labels": dias_ordenados,
        "dados": dados_dias,
        "altas_fim_de_semana": altas_fim_de_semana,
        "percentual_fim_de_semana": percentual_fim_de_semana,
        "percentual_trim": percentual_trim,
        "total_altas": total_altas
    })
    
def dashboard_altas_x_transferencia(request):
    id_estabelecimento = request.GET.get("estabelecimento")
    comanejo = request.GET.get("comanejo")

    data_inicio_str = request.GET.get("de")
    data_fim_str = request.GET.get("ate")

    try:
        data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date() if data_inicio_str else None
        data_fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date() if data_fim_str else None
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    pendencias = Pendencia.objects.exclude(dt_hr_alta_hospitalar__isnull=True)

    if data_inicio:
        pendencias = pendencias.filter(dt_hr_alta_hospitalar__date__gte=data_inicio)
    if data_fim:
        pendencias = pendencias.filter(dt_hr_alta_hospitalar__date__lte=data_fim)

    if id_estabelecimento:
        pendencias = pendencias.filter(id_estabelecimento=id_estabelecimento)

    if comanejo == "Sim":
        pendencias = pendencias.filter(tb_pendencia_comanejo_id_pendencia_fkey__isnull=False)
    elif comanejo == "Não":
        pendencias = pendencias.filter(tb_pendencia_comanejo_id_pendencia_fkey__isnull=True)

    pendencias_agrupadas = (
        pendencias
        .annotate(mes=TruncMonth('dt_hr_alta_hospitalar'))
        .values('mes')
        .annotate(
            saidas=Sum(
                Case(
                    When(~Q(id_motivo_saida__conteudo__in=["Transferência interna", "Transferência externa"]), then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
            transferencia_interna=Sum(
                Case(
                    When(id_motivo_saida__conteudo="Transferência interna", then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
            transferencia_externa=Sum(
                Case(
                    When(id_motivo_saida__conteudo="Transferência externa", then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
        )
        .order_by('mes')
    )

    # Montar listas para labels e dados das 3 séries
    labels = []
    dados_saidas = []
    dados_transferencia_interna = []
    dados_transferencia_externa = []

    for item in pendencias_agrupadas:
        labels.append(item['mes'].strftime("%m/%Y"))
        dados_saidas.append(item['saidas'] or 0)
        dados_transferencia_interna.append(item['transferencia_interna'] or 0)
        dados_transferencia_externa.append(item['transferencia_externa'] or 0)

    return JsonResponse({
        "labels": labels,
        "saidas": dados_saidas,
        "transferencia_interna": dados_transferencia_interna,
        "transferencia_externa": dados_transferencia_externa,
    })

def dashboard_previsoes_de_alta(request):
    id_estabelecimento = request.GET.get("estabelecimento")
    data_inicio_str = request.GET.get("de")
    data_fim_str = request.GET.get("ate")

    try:
        data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date() if data_inicio_str else None
        data_fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date() if data_fim_str else None
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    pendencias = Pendencia.objects.exclude(dt_hr_alta_medica__isnull=True)

    if data_inicio:
        pendencias = pendencias.filter(dt_hr_alta_medica__date__gte=data_inicio)
    if data_fim:
        pendencias = pendencias.filter(dt_hr_alta_medica__date__lte=data_fim)

    if id_estabelecimento:
        pendencias = pendencias.filter(id_estabelecimento=id_estabelecimento)

    # Agrupamento por médico
    dados_medicos = defaultdict(lambda: {
        "medico": "",
        "altas_com_previsao": [],
        "precisao_alta": []
    })

    for p in pendencias.select_related("id_medico__id_pessoa"):
        nome_medico = p.id_medico.id_pessoa.nome
        medico_id = p.id_medico.id
        chave = f"{medico_id}"

        altas_com_previsao = 100 if p.dt_previsao_alta else 0

        dt_alta_local = localtime(p.dt_hr_alta_medica)  # converte para fuso local
        precisao_alta = 100 if p.dt_previsao_alta and p.dt_previsao_alta == dt_alta_local.date() else 0

        dados_medicos[chave]["medico"] = nome_medico
        dados_medicos[chave]["altas_com_previsao"].append(altas_com_previsao)
        dados_medicos[chave]["precisao_alta"].append(precisao_alta)

    resultados = []
    total_altas = 0
    total_precisao = 0
    total_medicos = 0

    for dados in dados_medicos.values():
        qtd = len(dados["altas_com_previsao"])
        media_altas = round(sum(dados["altas_com_previsao"]) / qtd, 1) if qtd else 0
        media_precisao = round(sum(dados["precisao_alta"]) / qtd, 1) if qtd else 0

        resultados.append({
            "medico": dados["medico"],
            "altas_com_previsao": media_altas,
            "precisao_alta": media_precisao
        })

        total_altas += media_altas
        total_precisao += media_precisao
        total_medicos += 1

    media_geral_altas = round(total_altas / total_medicos, 1) if total_medicos else 0
    media_geral_precisao = round(total_precisao / total_medicos, 1) if total_medicos else 0

    # --------------------------
    # Cálculo do acumulado anual
    # --------------------------
    hoje = date.today()
    primeiro_dia_ano = date(hoje.year, 1, 1)
    ultimo_mes_passado = hoje.replace(day=1) - timedelta(days=1)
    ultimo_dia_mes_passado = date(ultimo_mes_passado.year, ultimo_mes_passado.month,
                                  monthrange(ultimo_mes_passado.year, ultimo_mes_passado.month)[1])

    pendencias_acumulado = Pendencia.objects.exclude(dt_hr_alta_medica__isnull=True)
    pendencias_acumulado = pendencias_acumulado.filter(
        dt_hr_alta_medica__date__gte=primeiro_dia_ano,
        dt_hr_alta_medica__date__lte=ultimo_dia_mes_passado
    )

    if id_estabelecimento:
        pendencias_acumulado = pendencias_acumulado.filter(id_estabelecimento=id_estabelecimento)

    total_acumulado = 0
    total_acumulado_precisao = 0
    count_acumulado = 0

    for p in pendencias_acumulado.select_related("id_medico__id_pessoa"):
        total_acumulado += 100 if p.dt_previsao_alta else 0
        total_acumulado_precisao += 100 if p.dt_previsao_alta and p.dt_previsao_alta == p.dt_hr_alta_medica.date() else 0
        count_acumulado += 1

    media_acumulado_altas = round(total_acumulado / count_acumulado, 1) if count_acumulado else 0
    media_acumulado_precisao = round(total_acumulado_precisao / count_acumulado, 1) if count_acumulado else 0

    resultados.sort(key=lambda x: x["precisao_alta"], reverse=True)

    return JsonResponse({
        "medicos": resultados,
        "media_altas_com_previsao": media_geral_altas,
        "media_precisao_alta": media_geral_precisao,
        "acumulado_ano_altas_com_previsao": media_acumulado_altas,
        "acumulado_ano_precisao": media_acumulado_precisao
    })

def dashboard_tempos_de_permanencia_mh(request):
    id_estabelecimento = request.GET.get("estabelecimento")
    id_medico = request.GET.get("medico")
    data_inicio_str = request.GET.get("de")
    data_fim_str = request.GET.get("ate")

    try:
        data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date() if data_inicio_str else None
        data_fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date() if data_fim_str else None
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    # Base query
    pendencias = Pendencia.objects.exclude(
        dt_hr_admissao_MH__isnull=True
    ).exclude(
        dt_hr_alta_medica__isnull=True
    ).exclude(
        dt_hr_alta_hospitalar__isnull=True
    )

    if data_inicio:
        pendencias = pendencias.filter(dt_hr_alta_hospitalar__date__gte=data_inicio)
    if data_fim:
        pendencias = pendencias.filter(dt_hr_alta_hospitalar__date__lte=data_fim)

    if id_estabelecimento:
        pendencias = pendencias.filter(id_estabelecimento=id_estabelecimento)

    if id_medico:
        pendencias = pendencias.filter(id_medico=id_medico)

    # Agrupamento por mês
    dados_por_mes = defaultdict(list)

    for p in pendencias:
        admissao = p.dt_hr_admissao_MH
        alta = p.dt_hr_alta_medica
        if not admissao or not alta:
            continue
        if alta < admissao:
            continue  # Exclui inconsistências

        dias = (alta - admissao).days
        mes_ref = alta.strftime("%Y-%m")

        dados_por_mes[mes_ref].append(dias)

    meses = sorted(dados_por_mes.keys())
    medias = [round(sum(dados_por_mes[mes]) / len(dados_por_mes[mes]), 1) for mes in meses]
    medianas = [round(statistics.median(dados_por_mes[mes]), 1) for mes in meses]

    return JsonResponse({
        "labels": meses,
        "media": medias,
        "mediana": medianas
    })

def dashboard_tempos_de_permanencia(request):
    id_estabelecimento = request.GET.get("estabelecimento")
    data_inicio_str = request.GET.get("de")
    data_fim_str = request.GET.get("ate")
    comanejo = request.GET.get("comanejo")

    try:
        data_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date() if data_inicio_str else None
        data_fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date() if data_fim_str else None
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    pendencias = Pendencia.objects.exclude(
        dt_hr_admissao_hospitalar__isnull=True
    ).exclude(
        dt_hr_alta_medica__isnull=True
    ).exclude(
        dt_hr_alta_hospitalar__isnull=True
    )

    if data_inicio:
        pendencias = pendencias.filter(dt_hr_alta_hospitalar__date__gte=data_inicio)
    if data_fim:
        pendencias = pendencias.filter(dt_hr_alta_hospitalar__date__lte=data_fim)
    if id_estabelecimento:
        pendencias = pendencias.filter(id_estabelecimento=id_estabelecimento)

    if comanejo == "Sim":
        pendencias = pendencias.filter(tb_pendencia_comanejo_id_pendencia_fkey__isnull=False)
    elif comanejo == "Não":
        pendencias = pendencias.filter(tb_pendencia_comanejo_id_pendencia_fkey__isnull=True)

    dados_por_mes = defaultdict(list)
    charlson_por_mes = defaultdict(list)

    # Para os campos adicionais:
    admissoes_no_periodo = 0
    longa_permanencia_count = 0
    soma_geral = 0
    count_geral = 0
    soma_longa = 0
    count_longa = 0
    soma_nao_longa = 0
    count_nao_longa = 0

    for p in pendencias:
        admissao = p.dt_hr_admissao_hospitalar
        alta = p.dt_hr_alta_medica

        if not admissao or not alta or alta < admissao:
            continue

        dias = (alta - admissao).days

        mes_ref = alta.strftime("%Y-%m")
        dados_por_mes[mes_ref].append(dias)

        if p.score_charlson is not None:
            charlson_por_mes[mes_ref].append(p.score_charlson)

        # Adicionais:
        if data_inicio and data_fim:
            if data_inicio <= admissao.date() <= data_fim:
                admissoes_no_periodo += 1
                if dias > 15:
                    longa_permanencia_count += 1

        soma_geral += dias
        count_geral += 1

        if dias > 15:
            soma_longa += dias
            count_longa += 1
        else:
            soma_nao_longa += dias
            count_nao_longa += 1

    meses = sorted(dados_por_mes.keys())

    medias = []
    medianas = []
    charlson_medias = []
    charlson_medianas = []

    for mes in meses:
        dias_list = dados_por_mes[mes]
        charlson_list = charlson_por_mes.get(mes, [])

        medias.append(round(sum(dias_list) / len(dias_list), 1) if dias_list else 0)
        medianas.append(round(statistics.median(dias_list), 1) if dias_list else 0)

        if charlson_list:
            charlson_medias.append(round(sum(charlson_list) / len(charlson_list), 1))
            charlson_medianas.append(round(statistics.median(charlson_list), 1))
        else:
            charlson_medias.append(0)
            charlson_medianas.append(0)

    return JsonResponse({
        "labels": meses,
        "media": medias,
        "mediana": medianas,
        "charlson_media": charlson_medias,
        "charlson_mediana": charlson_medianas,
        "admitidos_no_periodo": admissoes_no_periodo,
        "admitidos_em_longa_permanencia": longa_permanencia_count,
        "media_geral_tempo_permanencia": round(soma_geral / count_geral, 1) if count_geral else 0,
        "media_pacientes_longa_permanencia": round(soma_longa / count_longa, 1) if count_longa else 0,
        "media_pacientes_nao_longa_permanencia": round(soma_nao_longa / count_nao_longa, 1) if count_nao_longa else 0,
    })
    
def pendencias_por_estabelecimento(request):
    print('pendencias_por_estabelecimento')
    dados = (
        Pendencia.objects
        .values('id_estabelecimento__nome')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    labels = [d['id_estabelecimento__nome'] for d in dados]
    data = [d['total'] for d in dados]
    return JsonResponse({
        'labels': labels,
        'data': data
    })

def pendencias_por_origem(request):
    print('pendencias_por_estabelecimento')
    dados = (
        Pendencia.objects
        .values('id_origem_paciente__conteudo')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    labels = [d['id_origem_paciente__conteudo'] for d in dados]
    data = [d['total'] for d in dados]
    return JsonResponse({
        'labels': labels,
        'data': data
    })

def internacoes_por_mes(request):
    print('internacoes_por_mes')
    dados = (
        Pendencia.objects
        .annotate(mes=TruncMonth('dt_hr_admissao_hospitalar'))
        .values('mes')
        .annotate(total=Count('id'))
        .order_by('mes')
    )
    labels = [d['mes'].strftime('%b/%Y') for d in dados]
    data = [d['total'] for d in dados]
    return JsonResponse({
        'labels': labels,
        'data': data
    })

def pendencias_por_mes_alta(request):
    print('pendencias_por_mes_alta')
    data = (
        Pendencia.objects
        .filter(dt_hr_alta_hospitalar__isnull=False)
        .annotate(mes=TruncMonth('dt_hr_alta_hospitalar'))
        .values('mes')
        .annotate(qtd=Count('id'))
        .order_by('mes')
    )

    labels = [d['mes'].strftime('%m/%Y') for d in data]
    values = [d['qtd'] for d in data]

    return JsonResponse({'labels': labels, 'data': values})
