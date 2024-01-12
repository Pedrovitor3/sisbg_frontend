import { message } from 'antd';
import { APIFile } from './baseService/baseService';
import { getConfig } from '../../../configs/sistemaConfig';

export async function postFile(file: any) {
  const formData = new FormData();
  formData.append('arquivo', file);
  formData.append('tipoPermissao', 'PUBLICO');
  formData.append('namespace', 'pc');
  try {
    const response = await APIFile.post(
      '/uploadArquivo',
      formData,
      getConfig('file'),
    );
    message.success('cadastrado com sucesso');
    return response;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}
