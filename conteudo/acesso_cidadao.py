import requests
from django.shortcuts import redirect, render
from django.urls import reverse
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect, JsonResponse
import urllib.parse
import json
import datetime
from django.views.decorators.csrf import csrf_exempt
from conteudo.models import Usuario, Acessos
import uuid
from conteudo.constantes import c_Debug
import os

client_id = os.getenv('ACESSO_CIDADAO_CLIENT_ID')
if not client_id:
    raise ValueError("ACESSO_CIDADAO_CLIENT_ID não configurado. Configure via variável de ambiente")

#-----------------------------------------------------------------------------------#
#             Documentação online do Acesso Cidadão para desenvolvedores:           #
#                   https://docs.developer.acessocidadao.es.gov.br/                 #
#-----------------------------------------------------------------------------------#

#-----------------------------------------------------------------------------------#
#   Passo 1 - Realizar a autenticação no Acesso Cidadão (login e senha)             #
#-----------------------------------------------------------------------------------#
def autenticacao(request: HttpRequest) -> str:
    if c_Debug:
        host = request.get_host()
        if host == '127.0.0.1:8000':
            debug_token = os.getenv('DEBUG_TOKEN')
            if not debug_token:
                raise ValueError("DEBUG_TOKEN não configurado. Configure via variável de ambiente para desenvolvimento")
            request.session['access_token'] = debug_token
            request.session['user_details'] = {
                'apelido': 'Gláucio Henrique da Silva', 
                'cpfValidado': 'False', 
                'verificada': 'True', 
                'verificacaoTipo': 'ConfiabilidadeGovBrPrataOutros', 
                'subNovo': '6848d40d-8f0a-45f7-b920-086e03f1b33b', 
                'cpf': '02025065760', 
                'email': 'glauciosilva@saude.es.gov.br', 
                'nomeValidado': 'True', 
                'nome': 'Gláucio Henrique da Silva', 
                'name': 'Gláucio Henrique da Silva', 
                'sub': '479342'
            }
            return redirect('pendencia_listar')       
    
    
    
    # Client ID cadastrado no AC Admin para o sistema

    # A requisição é iniciada através de um GET para o endereço:
    authorizationEndpoint = os.getenv('ACESSO_CIDADAO_AUTHORIZATION_ENDPOINT')
    if not authorizationEndpoint:
        raise ValueError("ACESSO_CIDADAO_AUTHORIZATION_ENDPOINT não configurado. Configure via variável de ambiente")

    host = request.get_host() # Endereço do servidor onde a aplicação está sendo executada
    
    # Este será a URL permitida que deverá estar configurada no AC Admin
    # Esta rota será chamada pelo AC após a autenticação OK do usuário 
    # URI de retorno cadastrada para a app cliente no formato URL Encode
    # Por exemplo: http://127.0.0.1:8000/retorno_autenticacao_AC_obter_token_AC
    protocol = "https" if not request.get_host().startswith(("localhost", "127.0.0.1")) else "http"
    redirect_uri = f"{protocol}://{host}/autenticacao_AC"

    # Parâmetros para o GET da autenticação
    auth_params = {
        'response_type': 'code id_token',
        'client_id': client_id,
        'scope': 'openid profile cpf email nome', # Estes scopes deverão ser adicionados na configuração da aplicação no AC Admin
        'redirect_uri': redirect_uri,
        'state': str(uuid.uuid4()),
        'nonce': str(uuid.uuid4()),
        'response_mode': 'form_post',
    }    

    # URL para realizar a requisição via GET
    # Exemplo: https://acessocidadao.es.gov.br/is/connect/authorize?response_type=code%20id_token&client_id=[CLIENT_ID_DA_APLICAÇÃO]&scope=openid%20profile&redirect_uri=https%3A%2F%2Fappcliente.com.br%2Floginacessocidadao&nonce=[NONCE_GERADO]&state=[STATE_GERADO]&response_mode=form_post
    autenticacao_url_get = authorizationEndpoint + '?' + urllib.parse.urlencode(auth_params)

    # Realiza a chamada da URL via GET
    # Neste momento se o usuário estiver autenticado no AC será retornado o code, caso não esteja
    # autenticado no AC será solicitada a autenticação no AC e, após autenticado, retornar o code
    # O retorno deste GET será realizado na URL definida em redirect_uri
    # Esta URL de retorno também deverá estar configurada no AC Admin como URIs de redirecionamento autorizados
    return redirect(autenticacao_url_get)



#-----------------------------------------------------------------------------------#
#   Passo 2 - Autenticação (passo 1) ocorrida com sucesso, a requisição é retornada #
#             para a URL especificada na variável redirect_uri da URL de requisição #
#             do passo 1, enviando os parâmetros.                                   #
#                                                                                   #
#             A redirect_uri (URL de retorno) deverá estar configurada no sistema   #
#             no Acesso Cidadão Admin em "URIs de redirecionamento autorizados"     #
#                                                                                   #
#             Em tempo de desenvolvimento a URI de redirecionamento deverá ser      #
#             configurada em desenvolvimento no Acesso Cidadão Admin, quando em     #
#             produção esta configuração deverá ser feita em produção do Acesso     #
#             Cidadão Admin                                                         #
#-----------------------------------------------------------------------------------#
@csrf_exempt
def autenticacao_AC(request: HttpRequest) -> str:

    if 'code' in request.POST:
        # Neste ponto o usuário está autenticado no sistema
        # Os passos adiante neste if são para consumir os endpoints
        authorization_code = request.POST['code']

         # Chave secreta cadastrada no AC Admin para o sistema
        client_secret = os.getenv('ACESSO_CIDADAO_CLIENT_SECRET')
        if not client_secret:
            raise ValueError("ACESSO_CIDADAO_CLIENT_SECRET não configurado. Configure via variável de ambiente")

        # A requisição para obtenção do token é feita através de um POST para o endereço:
        token_url = os.getenv('ACESSO_CIDADAO_TOKEN_ENDPOINT')
        if not token_url:
            raise ValueError("ACESSO_CIDADAO_TOKEN_ENDPOINT não configurado. Configure via variável de ambiente")

        # Este será a URL permitida que deverá estar configurada no AC Admin 
        # Por exemplo: http://127.0.0.1:8000/autenticacao_AC
        protocol = "https" if not request.get_host().startswith(("localhost", "127.0.0.1")) else "http"
        redirect_uri = f"{protocol}://{request.get_host()}/autenticacao_AC"

        params = {
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'client_secret': client_secret,
            'code': authorization_code,
            'redirect_uri': redirect_uri,
        }

        data = urllib.parse.urlencode(params).encode()
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        # Montagem da URL para a obtenção do token via POST
        req = urllib.request.Request(token_url, data=data, headers=headers)

        try:
            # Chamada POST para a obtenção do token
            with urllib.request.urlopen(req) as response:
                # Obter a resposta da requisição POST
                responseData = json.loads(response.read())
                if 'access_token' in responseData:  
                    return redirect(f"http://{request.get_host()}/consumir_endpoints?access_token={responseData.get('access_token')}")
                else:
                    return HttpResponse("Erro: Token de acesso não encontrado na resposta.")
        except urllib.error.HTTPError as e:
            return HttpResponse(f"Erro: Falha ao fazer a solicitação para obter o token de acesso. Código de status: {e.code}")

    return HttpResponse(f"Erro: Falha ao fazer a solicitação para obter o token de acesso. Código de status: {e.code}")


#-----------------------------------------------------------------------------------#
#                                                                                   #
#   Consumir endpoints do sistema                                                   #
#                                                                                   #
#-----------------------------------------------------------------------------------#
def consumir_endpoints(request):
    if 'access_token' in request.GET:
        access_token = request.GET['access_token']
        api_url = os.getenv('ACESSO_CIDADAO_USERINFO_ENDPOINT')
        if not api_url:
            raise ValueError("ACESSO_CIDADAO_USERINFO_ENDPOINT não configurado. Configure via variável de ambiente")
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        try:
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
            responseData = response.json()

            request.session['access_token'] = access_token
            request.session['user_details'] = responseData

            #Usuario_Apelido  = responseData.get('apelido', '')
            #Usuario_Email = responseData.get('email', '')
            #Usuario_Nome = responseData.get('nome', '')
            cpf_usuario = responseData.get('cpf', '')

            try:
                #Controle de acessos
                #ip_address = socket.gethostbyname(socket.gethostname())
                ip_address = requests.get("https://api64.ipify.org?format=text").text
                hora_atual = datetime.datetime.now().time()
                acesso = Acessos.objects.filter(cpf=cpf_usuario, data=datetime.date.today()).first()
                if acesso:
                    acesso.hora = hora_atual
                    acesso.ip = ip_address
                    acesso.save()
                else:
                    novo_acesso = Acessos.objects.create(
                        cpf=cpf_usuario,
                        ip=ip_address,
                        data=datetime.date.today(), 
                        hora=hora_atual
                    )
            except Exception as e:
                print('acesso')


        except requests.exceptions.RequestException as e:
            # Se houver um erro ao fazer a solicitação HTTP, renderizar página de erro
            return redirect('gestor_icepi')

    usuarios = Usuario.objects.filter(id_pessoa__cpf=cpf_usuario, ativo=True)
    quantidade_usuarios = usuarios.count()

    if quantidade_usuarios == 0:
        return render(request, 'nao_autorizado.html')
    elif quantidade_usuarios == 1:
        return redirect('home', usuarios.first().perfil)
    else:
        contexto = {
            "titulo_aba" : "Qualifica Saúde Digital",
            "titulo_01"  : "Qualifica Saúde Digital",
            "titulo_02"  : "",
            "acao"       : "selecionar_perfil",
            "usuarios"   : usuarios,
        }
        return render(request, 'selecionar_perfil.html', contexto)

@csrf_exempt
def logout_view(request):
    # Limpar todos os dados da sessão e excluir o cookie de sessão
    request.session.flush()

    # Redirecionar para a página de logout externo ou página inicial
    logout_url = os.getenv('ACESSO_CIDADAO_LOGOUT_ENDPOINT')
    if not logout_url:
        raise ValueError("ACESSO_CIDADAO_LOGOUT_ENDPOINT não configurado. Configure via variável de ambiente")
    response = redirect(logout_url)

    # Excluir explicitamente o cookie de sessão, se necessário
    response.delete_cookie('sessionid')  # Nome padrão do cookie de sessão
    
    return response
