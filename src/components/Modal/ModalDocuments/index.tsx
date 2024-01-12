import {
  Modal,
  Form,
  Input,
  Col,
  message,
  Select,
  Row,
  Button,
  Upload,
  Popconfirm,
} from 'antd';
import { useEffect, useState } from 'react';
import {
  getDocuments,
  postDocuments,
  updateDocuments,
} from '../../../hooks/services/axios/documentsService';
import { getTypeDocuments } from '../../../hooks/services/axios/typeDocumentsService';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import ReactInputMask from 'react-input-mask';
import moment from 'moment';
import { getClassificacao } from '../../../hooks/services/axios/classificacaoService';
import { getCamada } from '../../../hooks/services/axios/camadaService';
import ModalTypeDocuments from '../ModalTypeDocuments';
import ModalClassificacao from '../ModalClassificacao';
import ModalCamada from '../ModalCamada';
import { pdfjs } from 'react-pdf';
import { postFile } from '../../../hooks/services/axios/fileService';

require('../index.css');

type Props = {
  updateDocumentsList: any;
  id: string;
  openModal: boolean;
  blocoId: string;
  closeModal: (refresh: boolean) => void;
};

const ModalDocuments = ({
  updateDocumentsList,
  id,
  blocoId,
  closeModal,
  openModal,
}: Props) => {
  const [form] = Form.useForm();

  const [docs, setDocs] = useState<any[]>([]);
  const [typesDocuments, setTypesDocuments] = useState<any[]>([]);
  const [classificacao, setClassificacao] = useState<any[]>([]);
  const [camada, setCamada] = useState<any[]>([]);

  const [selectTypeDocumentsId, setSelectedTypeDocumentsId] = useState('');
  const [selectClassificacaoId, setSelectedClassificacaoId] = useState('');
  const [selectCamadaId, setSelectedCamadaId] = useState('');

  // const [base64, setBase64] = useState<any>(null);

  const [showTypeDocumentsModal, setShowTypeDocumentsModal] = useState(false);
  const [showClassificacaoModal, setShowClassificacaoModal] = useState(false);
  const [showCamadaModal, setShowCamadaModal] = useState(false);

  const [hasArquivo, setHasArquivo] = useState<boolean>(false); // tem arquivo
  const [isUploading, setIsUploading] = useState(false);
  const [loadingDeleteFile, setLoadingDeleteFile] = useState(false); // Add this state variable

  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

  useEffect(() => {
    if (openModal) {
      loadingAllDocuments();
      setShowTypeDocumentsModal(false);
      setShowCamadaModal(false);
      setShowClassificacaoModal(false);
    }
    setHasArquivo(false);
  }, [openModal]);

  const hideModal = (refresh: boolean) => {
    setShowTypeDocumentsModal(false);
    setShowClassificacaoModal(false);
    setShowCamadaModal(false);

    loadingAllDocuments();
    setHasArquivo(false);
  };

  useEffect(() => {
    if (id && openModal) {
      loadingDocuments();
      setHasArquivo(false);
    }
  }, [openModal, id]);

  const loadingTypeDocuments = async () => {
    try {
      const response = await getTypeDocuments('typeDocuments');
      if (response !== false) {
        setTypesDocuments(response.data);
      } else {
        message.error('Ocorreu um erro inesperado ao obter as etapas.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter as etapas.');
    }
  };

  const loadingClassificacao = async () => {
    try {
      const response = await getClassificacao('classificacao');
      if (response !== false) {
        setClassificacao(response.data);
      } else {
        message.error('Ocorreu um erro inesperado ao obter as classificações.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter as classificações.');
    }
  };

  const loadingCamada = async () => {
    try {
      const response = await getCamada('camada');
      if (response !== false) {
        setCamada(response.data);
      } else {
        message.error('Ocorreu um erro inesperado ao obter as camadas.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter as camadas.');
    }
  };

  const loadingAllDocuments = async () => {
    try {
      const response = await getDocuments(`documents`);
      if (response) {
        const filteredStages = response.data.filter((documents: any) => {
          return documents.bloco && documents.bloco.id === blocoId;
        });
        setDocs(filteredStages);
        loadingCamada();
        loadingClassificacao();
        loadingTypeDocuments();
      } else {
        message.error('Ocorreu um erro inesperado ao obter os dados.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter os dados.');
    }
  };

  const loadingDocuments = async () => {
    if (id) {
      try {
        const response = await getDocuments(`documents/${id}`);
        if (response !== false) {
          if (response.data.arquivo !== null && response.data.arquivo !== '') {
            setHasArquivo(true);
            //setBase64(response.data.arquivo);
          }
          form.setFieldsValue({
            id: response.data.id,
            name: response.data.name,
            assunto: response.data.assunto,
            position: response.data.position,
            data: response.data.data,
            bloco: response.data?.bloco ? response.data.bloco.id : null,
            arquivo: response.data.arquivo,
            typeDocuments: response.data?.typeDocuments
              ? response.data?.typeDocuments.id
              : null,
            classificacao: response.data?.classificacao
              ? response.data?.classificacao.id
              : null,
            camada: response.data?.camada ? response.data?.camada.id : null,
          });
        } else {
          message.error('Ocorreu um erro inesperado ao obter o documento.');
        }
      } catch (error) {
        message.error('Ocorreu um erro inesperado ao obter o documento.');
      }
    }
  };

  const handleOk = (e: any) => {
    e.preventDefault();
    form
      .validateFields()
      .then(() => {
        const formData = form.getFieldsValue(true);
        if (id) {
          submitUpdate();
        } else {
          const maxPosition =
            docs.length > 0
              ? Math.max(...docs.map((doc: any) => doc.position))
              : 0;
          const newPosition = maxPosition + 1;
          formData.position = newPosition;
          submitCreate();
        }
        form.resetFields();
        closeModal(true);
      })
      .catch(errorInfo => message.error('Erro no preenchimento dos campos.'));
  };

  const submitUpdate = async () => {
    const editingDocuments = form.getFieldsValue(true);

    // editingDocuments.arquivo = base64;

    await updateDocuments(editingDocuments, id);

    updateDocumentsList(editingDocuments);
  };

  const submitCreate = async () => {
    const editingDocuments = form.getFieldsValue(true);
    // editingDocuments.arquivo = base64;

    await postDocuments(editingDocuments);

    updateDocumentsList(editingDocuments);
    setDocs(prevDocs => [...prevDocs, editingDocuments]);
  };

  function handleSelectTypeDocuments(value: any) {
    setSelectedTypeDocumentsId(value);
  }

  function handleSelectClassificacao(value: any) {
    setSelectedClassificacaoId(value);
  }
  function handleSelectCamada(value: any) {
    setSelectedCamadaId(value);
  }

  const sendFileToFileWs = async (pdfData: File) => {
    try {
      setIsUploading(true);
      //posta arquivo no filews
      const res: any = await postFile(pdfData);
      if (res) {
        console.log('res', res);
        form.setFieldValue('arquivo', res?.data?.id);
      }

      //const base64Data = await getBase64(pdfData);
      //setBase64(base64Data);

      setHasArquivo(true);
      setIsUploading(false);
    } catch {
      message.error('Ocorreu um erro ao receber o arquivo');
    }
  };

  //função de gerar base64 se for necessario
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1]; // Remove the prefix
        resolve(base64Data);
      };

      reader.onerror = error => {
        reject(error);
      };
    });
  };

  const isDateValid = (value: any) => {
    return moment(value, 'DD/MM/YYYY', true).isValid();
  };

  const handleDeleteFile = async () => {
    try {
      if (id) {
        const res = await getDocuments(`documents/${id}`);
        if (res) {
          setLoadingDeleteFile(true); // Set loading state to true
          const editingDocuments = form.getFieldsValue(true);
          editingDocuments.arquivo = null; // Add the base64 data to the form data
          await updateDocuments(editingDocuments, id),
            setLoadingDeleteFile(false); // Set loading state to false after deletion
        }
      }

      setHasArquivo(false);
      //  setBase64(null);
    } catch (error) {
      message.error('Ocorreu um erro ao excluir o documento.');
    }
  };
  return (
    <>
      <Modal
        visible={openModal}
        title="Documento"
        okText="Salvar"
        width={700}
        onCancel={() => {
          form.resetFields();
          closeModal(false);
        }}
        onOk={handleOk}
      >
        <Form layout="vertical" form={form}>
          <Row gutter={15} style={{ height: '120px' }}>
            <Col offset={1} span={12}>
              <Form.Item
                name="name"
                label="Nome"
                rules={[
                  {
                    required: true,
                    message: 'Por favor, insira o nome',
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col offset={1} span={9}>
              <Form.Item
                name={['data']}
                label="Data do Documento"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || isDateValid(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        'Por favor, insira uma data válida ',
                      );
                    },
                  }),
                ]}
              >
                <ReactInputMask
                  className="input-mask-date"
                  placeholder="00/00/0000"
                  maskChar={null}
                  mask="99/99/9999"
                />
              </Form.Item>
            </Col>
            {/*
            <Col offset={1} span={9}>
              <Form.Item name="position" label="Posição">
                <Input type="number" />
              </Form.Item>
              </Col>*/}
          </Row>
          <Row gutter={5} style={{ height: '120px' }}>
            <Col offset={1} span={12}>
              <Form.Item
                name="assunto"
                label="Assunto"
                rules={[
                  {
                    required: true,
                    message: 'Por favor, insira o assunto',
                  },
                ]}
              >
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 3 }} />
              </Form.Item>
            </Col>

            <Col offset={1} span={8}>
              <Form.Item
                name={['typeDocuments']}
                label="Tipo de documento"
                rules={[]}
              >
                <Select
                  showSearch
                  placeholder={'Selecione o tipo do documento'}
                  onChange={value => handleSelectTypeDocuments(value)}
                  value={selectTypeDocumentsId}
                  filterOption={(input, option) =>
                    (option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={[
                    { label: 'Nenhum', value: null }, // Opção vazia
                    ...typesDocuments.map(type => ({
                      label: type.name,
                      value: type.id,
                    })),
                  ]}
                ></Select>
              </Form.Item>
            </Col>
            <Col offset={0} span={1}>
              <Button
                style={{
                  marginTop: '29px',
                  marginLeft: '0px',
                  marginRight: '12px',
                  width: '4%',
                }}
                className="button-modal"
                onClick={() => {
                  setShowTypeDocumentsModal(true);
                }}
              >
                <div className="icone">
                  <PlusOutlined />
                </div>
              </Button>
            </Col>
          </Row>
          <Row gutter={5}>
            <Col offset={1} span={10}>
              <Form.Item
                name={['classificacao']}
                label="Classificação"
                rules={[]}
              >
                <Select
                  style={{ width: '300px' }}
                  showSearch
                  placeholder={'Selecione a Classificação'}
                  onChange={value => handleSelectClassificacao(value)}
                  value={selectClassificacaoId}
                  filterOption={(input, option) =>
                    (option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={[
                    { label: 'Nenhum', value: null }, // Opção vazia
                    ...classificacao.map(classificacao => ({
                      label: classificacao.name,
                      value: classificacao.id,
                    })),
                  ]}
                ></Select>
              </Form.Item>
            </Col>
            <Col offset={0} span={1}>
              <Form.Item>
                <Button
                  style={{
                    marginTop: '29px',
                    marginLeft: '20px',
                    marginRight: '12px',
                    width: '4%',
                  }}
                  className="button-modal"
                  onClick={() => {
                    setShowClassificacaoModal(true);
                  }}
                >
                  <div className="icone">
                    <PlusOutlined />
                  </div>
                </Button>
              </Form.Item>
            </Col>

            <Col offset={2} span={8}>
              <Form.Item name={['camada']} label="Camada" rules={[]}>
                <Select
                  showSearch
                  placeholder={'Selecione a camada'}
                  onChange={value => handleSelectCamada(value)}
                  value={selectCamadaId}
                  filterOption={(input, option) =>
                    (option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={[
                    { label: 'Nenhum', value: null }, // Opção vazia
                    ...camada.map(camada => ({
                      label: camada.name,
                      value: camada.id,
                    })),
                  ]}
                ></Select>
              </Form.Item>
            </Col>
            <Col offset={0} span={1}>
              <Button
                style={{
                  marginTop: '29px',
                  marginLeft: '0px',
                  marginRight: '12px',
                  width: '4%',
                }}
                className="button-modal"
                onClick={() => {
                  setShowCamadaModal(true);
                }}
              >
                <div className="icone">
                  <PlusOutlined />
                </div>
              </Button>
            </Col>
          </Row>
          <Col offset={1}>
            <Form.Item name="arquivos" label="Arquivo" valuePropName="file">
              <Upload
                name="file"
                //action="/upload"
                beforeUpload={file => {
                  sendFileToFileWs(file);
                  return false;
                }}
                maxCount={1}
                disabled={hasArquivo !== false}
                showUploadList={false} // Adicione esta linha
              >
                <Button
                  icon={
                    isUploading ? (
                      <LoadingOutlined />
                    ) : hasArquivo ? (
                      <CheckCircleOutlined />
                    ) : (
                      <UploadOutlined />
                    )
                  }
                  disabled={hasArquivo !== false || isUploading}
                >
                  {isUploading
                    ? 'Enviando...'
                    : hasArquivo
                    ? 'Arquivo Anexado'
                    : 'Anexar Arquivo'}
                </Button>
              </Upload>
              {hasArquivo && (
                <Popconfirm
                  title="Tem certeza que deseja apagar o arquivo?"
                  onConfirm={() => {
                    handleDeleteFile();
                  }}
                  okText="Sim"
                  cancelText="Não"
                >
                  <Button icon={<DeleteOutlined />} type="link">
                    {loadingDeleteFile ? 'Excluindo...' : 'Apagar Arquivo'}
                  </Button>
                </Popconfirm>
              )}
            </Form.Item>
            <Form.Item name="bloco" initialValue={blocoId} className="hidden" />
          </Col>
        </Form>
      </Modal>

      <ModalTypeDocuments
        id={''}
        openModal={showTypeDocumentsModal}
        closeModal={hideModal}
        updateTypeDocumentsList={loadingDocuments}
      />
      <ModalClassificacao
        openModal={showClassificacaoModal}
        closeModal={hideModal}
        updateClassificacaoList={loadingDocuments}
        id={''}
      />
      <ModalCamada
        openModal={showCamadaModal}
        closeModal={hideModal}
        updateCamadaList={loadingDocuments}
        id={''}
      />
    </>
  );
};

export default ModalDocuments;
