from django.db import models
from datetime import datetime, date
from django.utils.timezone import localtime
from django.utils import timezone
from .constantes import c_Gravado

# Create your models here.

class Pessoa(models.Model):
    id = models.AutoField(primary_key=True)
    cpf = models.CharField() 
    nome = models.CharField(max_length=255) 
    termo_uso = models.BooleanField(default=False)
    ativo = models.BooleanField(default=False)
    id_usuario_alteracao = models.ForeignKey('Usuario', on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_pessoa_id_usuario_alteracao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)

    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_pessoa'

    def __str__(self):
        return self.nome  
    
class Usuario(models.Model):
    id = models.AutoField(primary_key=True)
    id_pessoa = models.ForeignKey(Pessoa, on_delete=models.PROTECT, db_column='id_pessoa', related_name='tb_usuario_id_pessoa_fkey')
    perfil = models.CharField()
    id_estabelecimento = models.ForeignKey('Estabelecimento', on_delete=models.PROTECT, db_column='id_estabelecimento', related_name='tb_usuario_id_estabelecimento_fkey')
    ativo = models.BooleanField(default=True)
    dt_hr_alteracao = models.DateTimeField(auto_now=True)   
    id_usuario_alteracao = models.ForeignKey('self', on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_usuario_id_usuario_alteracao_fkey')
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_usuario'

    def __str__(self):
        return self.id_pessoa.nome 
    
class Regional(models.Model):
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=30, null=True, blank=True)
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_regional'

    def __str__(self):
        return self.nome 
    

class Municipio(models.Model):
    id = models.AutoField(primary_key=True)
    uf = models.CharField(max_length=2)
    nome = models.CharField(max_length=80)
    ativo = models.BooleanField(default=False)
    id_regional = models.ForeignKey(Regional, on_delete=models.PROTECT, db_column='id_regional', related_name='tb_municipio_id_regional_fkey')
    codigo_ibge = models.IntegerField()
    latitude = models.IntegerField()
    longitude = models.IntegerField()
    id_usuario_alteracao = models.ForeignKey('Usuario', on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_municipio_id_usuario_alteracao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_municipio'

    def __str__(self):
        return self.nome
     
    
class Estabelecimento(models.Model):
    id = models.AutoField(primary_key=True)
    nome = models.CharField()
    sigla = models.CharField()
    cnes = models.CharField()
    ativo = models.BooleanField(default=True)
    mv = models.BooleanField(default=True)
    dt_hr_alteracao = models.DateTimeField(auto_now=True)   
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_estabelecimento_id_usuario_alteracao_fkey')
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_estabelecimento'

    def __str__(self):
        return self.nome
    
class Subgrupo(models.Model):
    id = models.AutoField(primary_key=True)
    grupo = models.CharField()
    conteudo = models.CharField()
    ativo = models.BooleanField(default=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_subgrupo_id_usuario_alteracao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)   
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_subgrupo'

    def __str__(self):
        return self.conteudo
    
    
class Tipo_Pendencia(models.Model):
    id = models.AutoField(primary_key=True)
    id_tp_pendencia = models.ForeignKey(Subgrupo, on_delete=models.PROTECT, db_column='id_tp_pendencia', related_name='tb_tipo_pendencia_id_tp_pendenciaa_fkey')
    pendencia = models.CharField()
    ativo = models.BooleanField(default=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_tipo_pendencia_id_usuario_alteracao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)   
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_tipo_pendencia'

    def __str__(self):
        return self.pendencia

class Unidade(models.Model):
    id = models.AutoField(primary_key=True)
    id_estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.PROTECT, db_column='id_estabelecimento', related_name='tb_unidade_id_estabelecimento_fkey')
    unidade = models.CharField()
    ativo = models.BooleanField(default=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_unidade_id_usuario_alteracao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)   
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_unidade'

    def __str__(self):
        return self.unidade
    
class CID(models.Model):
    id = models.AutoField(primary_key=True)
    codigo = models.CharField()
    desc = models.CharField()
    ativo = models.BooleanField(default=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_cid_id_usuario_alteracao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)   
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_cid'

    def __str__(self):
        return self.desc    
    
class Profissional(models.Model):
    id = models.AutoField(primary_key=True)
    id_pessoa = models.ForeignKey(Pessoa, on_delete=models.PROTECT, db_column='id_pessoa', related_name='tb_profissional_id_pessoa_fkey')
    id_estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.PROTECT, db_column='id_estabelecimento', related_name='tb_profissional_id_estabelecimento_fkey')
    id_tp_profissional = models.ForeignKey(Subgrupo, on_delete=models.PROTECT, db_column='id_tp_profissional', related_name='tb_profissional_id_tp_profissional_fkey')
    ativo = models.BooleanField(default=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_profissional_id_usuario_alteracao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)   
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_profissional'

    def __str__(self):
        return self.id_pessoa.nome
    
class Acessos(models.Model):
    id = models.AutoField(primary_key=True)
    cpf = models.CharField(max_length=11)
    data = models.DateField(auto_now=True)
    hora = models.TimeField()    
    ip = models.CharField(max_length=15)
    
    class Meta:
        managed = False
        db_table = 'tb_acessos'

    def __str__(self):
        return self.data         

class Paciente(models.Model):
    id = models.AutoField(primary_key=True)
    nr_cpf = models.CharField(max_length=11, null=True, blank=True)
    nr_cns = models.CharField(max_length=14, null=True, blank=True)
    nome = models.CharField(max_length=255, null=True, blank=True)
    nome_mae = models.CharField(max_length=255, null=True, blank=True)
    dt_nascimento = models.DateField(null=True, blank=True)
    dt_hr_alteracao = models.DateTimeField(auto_now=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_paciente_id_usuario_alteracao_fkey')

    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_paciente'

    def __str__(self):
        return self.nome
    
    @property
    def dt_nascimento_D_M_A(self):
        pass
        
class Pendencia(models.Model):
    id = models.AutoField(primary_key=True)
    nr_atendimento_mv = models.IntegerField()
    id_paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, db_column='id_paciente', related_name='tb_pendencia_id_paciente_fkey')
    nr_paciente_mv = models.IntegerField()
    municipio_mv = models.CharField(max_length=255, null=True, blank=True)
    uf_mv = models.CharField(max_length=2, null=True, blank=True)
    id_estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.PROTECT, db_column='id_estabelecimento', related_name='tb_pendencia_id_estabelecimento_fkey')
    estabelecimento_mv = models.CharField(max_length=255, null=True, blank=True)
    unidade_mv = models.CharField(max_length=255, null=True, blank=True)
    id_unidade = models.ForeignKey(Unidade, on_delete=models.PROTECT, db_column='id_unidade', related_name='tb_pendencia_id_unidade_fkey')
    id_enfermeiro = models.ForeignKey(Profissional, on_delete=models.PROTECT, db_column='id_enfermeiro', related_name='tb_pendencia_id_enfermeiro_fkey')
    id_medico = models.ForeignKey(Profissional, on_delete=models.PROTECT, db_column='id_medico', related_name='tb_pendencia_id_medico_fkey')
    id_origem_paciente = models.ForeignKey(Subgrupo, on_delete=models.PROTECT, db_column='id_origem_paciente', related_name='tb_pendencia_id_origem_paciente_fkey')
    id_motivo_admissao = models.ForeignKey(Subgrupo, on_delete=models.PROTECT, db_column='id_motivo_admissao', related_name='tb_pendencia_id_motivo_admissao_fkey')
    score_charlson = models.IntegerField()
    id_cuidados_paliativos = models.ForeignKey(Subgrupo, on_delete=models.PROTECT, db_column='id_cuidados_paliativos', related_name='tb_pendencia_id_cuidados_paliativos_fkey')
    dt_hr_admissao_hospitalar = models.DateTimeField()
    dt_hr_admissao_MH = models.DateTimeField()
    dt_previsao_alta_inicial = models.DateField()
    dt_previsao_alta = models.DateField()
    comanejo_sim_nao = models.BooleanField(default=False)
    id_motivo_saida = models.ForeignKey(Subgrupo, on_delete=models.PROTECT, db_column='id_motivo_saida', related_name='tb_pendencia_id_motivo_saida_fkey')
    id_setor = models.ForeignKey(Subgrupo, on_delete=models.PROTECT, db_column='id_setor', related_name='tb_pendencia_id_setor_fkey')
    id_cid = models.ForeignKey(CID, on_delete=models.PROTECT, db_column='id_cid', related_name='tb_pendencia_id_cid_fkey')
    dt_hr_alta_medica = models.DateTimeField()
    dt_hr_alta_hospitalar = models.DateTimeField()
    dt_hr_criacao = models.DateTimeField()
    id_usuario_criacao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_criacao', related_name='tb_pendencia_id_usuario_criacao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_pendencia_id_usuario_alteracao_fkey')
    encerrada = models.BooleanField(default=False)

    status = c_Gravado
    comanejo_sim_nao_inicial = False
    dias_de_internacao = 0
    ultimo_acompanhamento = "Sem acompanhamento registrado"

    class Meta:
        managed = False
        db_table = 'tb_pendencia'

    def __str__(self):
        return self.nr_atendimento_mv
    
    @property
    def dt_hr_admissao_hospitalar_D_M_Y_H(self):
        if not self.dt_hr_admissao_hospitalar:
            return ""  # Se for None, retorna string vazia

        # Se for string, converte para datetime
        if isinstance(self.dt_hr_admissao_hospitalar, str):
            try:
                dt_obj = datetime.strptime(self.dt_hr_admissao_hospitalar, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                return self.dt_hr_admissao_hospitalar  # Retorna como está se o formato não for o esperado
        else:
            dt_obj = self.dt_hr_admissao_hospitalar

        # Ajusta para o fuso local e formata
        return localtime(dt_obj).strftime("%d/%m/%Y %H:%M")
    
    @property
    def dt_hr_alta_medica_D_M_Y_H(self):
        if not self.dt_hr_alta_medica:
            return ""  # Se for None, retorna string vazia

        # Se for string, converte para datetime
        if isinstance(self.dt_hr_alta_medica, str):
            try:
                dt_obj = datetime.strptime(self.dt_hr_alta_medica, "%d/%m/%Y %H:%M")
            except ValueError:
                return self.dt_hr_alta_medica  # Retorna como está se o formato não for o esperado
        else:
            dt_obj = self.dt_hr_alta_medica

        # Ajusta para o fuso local e formata
        #return localtime(dt_obj).strftime("%Y-%m-%dT%H:%M:%S")
        return dt_obj.strftime("%Y-%m-%dT%H:%M")    

    @property
    def dt_hr_alta_hospitalar_D_M_Y_H(self):
        if not self.dt_hr_alta_hospitalar:
            return ""  # Se for None, retorna string vazia

        # Se for string, converte para datetime
        if isinstance(self.dt_hr_alta_hospitalar, str):
            try:
                dt_obj = datetime.strptime(self.dt_hr_alta_hospitalar, "%d/%m/%Y %H:%M")
            except ValueError:
                return self.dt_hr_alta_hospitalar  # Retorna como está se o formato não for o esperado
        else:
            dt_obj = self.dt_hr_alta_hospitalar

        # Ajusta para o fuso local e formata
        #return localtime(dt_obj).strftime("%Y-%m-%dT%H:%M:%S")
        return dt_obj.strftime("%Y-%m-%dT%H:%M")
    
    @property
    def dt_previsao_alta_D_M_Y(self):
        if not self.dt_previsao_alta:
            return ""  # Se for None, retorna string vazia

        # Se for string, converte para date
        if isinstance(self.dt_previsao_alta, str):
            try:
                dt_obj = datetime.strptime(self.dt_previsao_alta, "%Y-%m-%d").date()
            except ValueError:
                return self.dt_previsao_alta  # Retorna como está se o formato não for o esperado
        else:
            dt_obj = self.dt_previsao_alta

        # Retorna formatado como "DD/MM/YYYY"
        return dt_obj.strftime("%Y-%m-%d")
        
    @property
    def dt_hr_admissao_MH_D_M_Y(self):
        if not self.dt_hr_admissao_MH:
            return ""  # Se for None, retorna string vazia

        # Se for string, converte para date
        if isinstance(self.dt_hr_admissao_MH, str):
            try:
                dt_obj = datetime.strptime(self.dt_hr_admissao_MH, "%Y-%m-%d").date()
            except ValueError:
                return self.dt_hr_admissao_MH  # Retorna como está se o formato não for o esperado
        else:
            dt_obj = self.dt_hr_admissao_MH

        # Retorna formatado como "DD/MM/YYYY"
        return dt_obj.strftime("%Y-%m-%d")

    @property
    def dt_hr_admissao_MH_D_M_Y_H(self):
        if not self.dt_hr_admissao_MH:
            return ""  # Se for None, retorna string vazia

        # Se for string, converte para datetime
        if isinstance(self.dt_hr_admissao_MH, str):
            try:
                dt_obj = datetime.strptime(self.dt_hr_admissao_MH, "%d/%m/%Y %H:%M")
            except ValueError:
                return self.dt_hr_admissao_MH  # Retorna como está se o formato não for o esperado
        else:
            dt_obj = self.dt_hr_admissao_MH

        # Ajusta para o fuso local e formata
        return localtime(dt_obj).strftime("%Y-%m-%dT%H:%M:%S")
    
    @property
    def dias_de_internacao_hospitalar(self):
        if isinstance(self.dt_hr_admissao_hospitalar, str):
            dt_hr_admissao_hospitalar_formatada = datetime.strptime(self.dt_hr_admissao_hospitalar, "%d/%m/%Y %H:%M")
        else:
            dt_hr_admissao_hospitalar_formatada = self.dt_hr_admissao_hospitalar

        if self.dt_hr_admissao_hospitalar:
            now = timezone.now().date()  # Obtém a data atual
            return (now - dt_hr_admissao_hospitalar_formatada.date()).days
        return 0

    @property
    def dias_de_internacao_MH(self):
        if isinstance(self.dt_hr_admissao_MH, str):
            dt_hr_admissao_MH_formatada = datetime.strptime(self.dt_hr_admissao_MH, "%d/%m/%Y %H:%M")
        else:
            dt_hr_admissao_MH_formatada = self.dt_hr_admissao_MH

        if self.dt_hr_admissao_MH:
            now = timezone.now().date()  # Obtém a data atual
            return (now - dt_hr_admissao_MH_formatada.date()).days
        return 0

    @property
    def semaforo_internacao_hospitalar(self):
        if self.dias_de_internacao_hospitalar < 0:
            return None
        elif self.dias_de_internacao_hospitalar <= 7:
            return 'green'
        elif self.dias_de_internacao_hospitalar <= 14:
            return 'yellow'
        elif self.dias_de_internacao_hospitalar > 14:
            return 'red'

        return None
        
    @property
    def semaforo_internacao_MH(self):
        if self.dias_de_internacao_MH < 0:
            return None
        elif self.dias_de_internacao_MH <= 7:
            return 'green'
        elif self.dias_de_internacao_MH <= 14:
            return 'yellow'
        elif self.dias_de_internacao_MH > 14:
            return 'red'
       
        return None

    
class Pendencia_Item(models.Model):
    id = models.AutoField(primary_key=True)
    id_pendencia = models.ForeignKey(Pendencia, on_delete=models.PROTECT, db_column='id_pendencia', related_name='tb_pendencia_item_id_pendencia_fkey')
    id_tipo_pendencia = models.ForeignKey(Tipo_Pendencia, on_delete=models.PROTECT, db_column='id_tipo_pendencia', related_name='tb_pendencia_item_id_tipo_pendencia_fkey')
    dt_hr_inicio = models.DateTimeField()
    dt_hr_encerramento = models.DateTimeField()
    dt_hr_criacao = models.DateTimeField()
    id_usuario_criacao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_criacao', related_name='tb_pendencia_item_id_usuario_criacao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_pendencia_item_id_usuario_alteracao_fkey')
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_pendencia_item'

    def __str__(self):
        return self.id_tipo_pendencia    
    
class Pendencia_Item_Acompanhamento(models.Model):
    id = models.AutoField(primary_key=True)
    id_pendencia_item = models.ForeignKey(Pendencia_Item, on_delete=models.PROTECT, db_column='id_pendencia_item', related_name='tb_pendencia_item_acompanhamento_id_pendencia_item_fkey')
    descricao = models.TextField()
    dt_hr_criacao = models.DateTimeField()
    id_usuario_criacao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_criacao', related_name='tb_pendencia_item_acompanhamento_id_usuario_criacao_fkey')
    dt_hr_alteracao = models.DateTimeField(auto_now=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_pendencia_item_acompanhamento_id_usuario_alteracao_fkey')
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_pendencia_item_acompanhamento'

    def __str__(self):
        return self.descricao       
    
class Pendencia_Comanejo(models.Model):
    id = models.AutoField(primary_key=True)
    id_pendencia = models.ForeignKey(Pendencia, on_delete=models.PROTECT, db_column='id_pendencia', related_name='tb_pendencia_comanejo_id_pendencia_fkey')
    id_especialidade = models.ForeignKey(Subgrupo, on_delete=models.PROTECT, db_column='id_especialidade', related_name='tb_pendencia_comanejo_id_especialidade_fkey')
    dt_admissao = models.DateField()
    dt_saida = models.DateField()
    dt_hr_alteracao = models.DateTimeField(auto_now=True)
    id_usuario_alteracao = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_alteracao', related_name='tb_pendencia_comanejo_id_usuario_alteracao_fkey')
    
    status = c_Gravado

    class Meta:
        managed = False
        db_table = 'tb_pendencia_comanejo'

    def __str__(self):
        return self.id_especialidade.conteudo           
 