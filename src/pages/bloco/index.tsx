import {
  Avatar,
  Button,
  Dropdown,
  List,
  Popconfirm,
  Space,
  Spin,
  message,
} from 'antd';
import { useState, useEffect } from 'react';
import { MoreOutlined } from '@ant-design/icons';
import ModalBloco from '../../components/Modal/ModalBloco';
import { deleteBloco, getBloco } from '../../hooks/services/axios/blocoService';
import {
  deleteDocuments,
  getDocuments,
} from '../../hooks/services/axios/documentsService';
import ModalArquivo from '../../components/Modal/ModalArquivo';

require('../index.css');

interface DataType {
  key: React.Key;
  id: any;
  name: any;
  boletim: any;
  position: any;
}

interface DocType {
  key: React.Key;
  id: any;
  name: any;
  bloco: any;
  description: any;
}

type DataIndex = keyof DataType;

type Props = {
  setChave: (id: string) => void;
  boletim: any;
  onBlocoIdChange: (id: string) => void;
};

export default function Bloco({ boletim, setChave, onBlocoIdChange }: Props) {
  const [bloco, setBloco] = useState<DataType[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [camada, setCamada] = useState<any[]>([]);
  const [classificacao, setClassificacao] = useState<any[]>([]);

  const [recordBloco, setRecordBloco] = useState<any>({});

  const [showBlocoModal, setShowBlocoModal] = useState(false);
  const [showArquivoModal, setShowArquivoModal] = useState(false);

  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false); //gerando doumento

  useEffect(() => {
    setShowBlocoModal(false);
    setShowArquivoModal(false);

    loadingBloco();
  }, []);

  const updateBlocoList = (bloco: any) => {
    setBloco(prevBloco => [...prevBloco, bloco]);
    loadingBloco();
  };

  const loadingBloco = async () => {
    try {
      const blocoResponse = await getBloco('bloco');
      if (blocoResponse !== false) {
        //filtra apenas os blocos do boletim recebido
        const filteredBlocos = blocoResponse.data.filter((bloco: any) => {
          return bloco.boletim && bloco.boletim.id === boletim.id;
        });
        //ordena os blocos
        const sortedBlocos = filteredBlocos.sort((a: any, b: any) => {
          return parseInt(a.position, 10) - parseInt(b.position, 10);
        });

        setBloco(sortedBlocos);
      } else {
        message.error('Ocorreu um erro inesperado ao obter os blocos.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter os dados.');
    }
  };

  const loadingDocs = async (blocoId: any) => {
    try {
      const response = await getDocuments('documents');
      if (response !== false) {
        //filtra apenas os documentos do bloco recebido
        const filteredStages = response.data.filter((documents: any) => {
          return documents.bloco && documents.bloco.id === blocoId;
        });
        //ordena os docs
        const sortedDocuments = filteredStages.sort((a: any, b: any) => {
          return parseInt(a.position, 10) - parseInt(b.position, 10);
        });

        return sortedDocuments;
      } else {
        message.error('Ocorreu um erro inesperado ao obter os blocos.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter os dados.');
    }
  };

  //função de carregar os dados para enviar ao pdf final
  const loadingData = async () => {
    //carrega os dados para enviar para o modal arquivo
    setIsGeneratingDocument(true);

    try {
      const documentResponse = await getDocuments('documents');
      if (documentResponse !== false) {
        const filteredDocumentos = documentResponse.data.filter(
          (documento: { bloco: { id: any; boletim: { id: string } } }) => {
            return (
              documento.bloco &&
              bloco.some((bloco: any) => bloco.id === documento.bloco.id) &&
              documento.bloco.boletim.id === boletim.id
            );
          },
        );

        // Ordenar os documentos por 'position'
        const sortedDocumentos = filteredDocumentos.sort((a: any, b: any) => {
          return parseInt(a.position, 10) - parseInt(b.position, 10);
        });

        setDocuments(sortedDocumentos);

        const uniqueClassificacoes = new Set<string>();
        const uniqueCamada = new Set<string>();

        //carrega as classificações e camadas
        sortedDocumentos.forEach((doc: { classificacao: { name: string } }) => {
          if (doc.classificacao && doc.classificacao.name) {
            uniqueClassificacoes.add(doc.classificacao.name);
          }
        });

        sortedDocumentos.forEach((doc: { camada: { name: string } }) => {
          if (doc.camada && doc.camada.name) {
            uniqueCamada.add(doc.camada.name);
          }
        });

        setClassificacao(Array.from(uniqueClassificacoes));
        setCamada(Array.from(uniqueCamada));
        setIsGeneratingDocument(false);

        setShowArquivoModal(true);
      } else {
        setIsGeneratingDocument(false);
        message.error('Ocorreu um erro inesperado ao obter os blocos.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter os dados.');
    }
  };

  const hideModal = (refresh: boolean) => {
    setShowBlocoModal(false);
    setShowArquivoModal(false);
    setRecordBloco(null);
    if (refresh) setBloco([]);
  };

  //voltar para pagina dos boletins
  const handleBoletimClick = () => {
    setChave('4');
  };

  //voltar para entrar no bloco
  const handleBlocoClick = (blocoId: string) => {
    setChave('6');
    onBlocoIdChange(blocoId);
  };

  const handleMenuClick = (e: any) => {
    if (e.key === '1') {
      setShowBlocoModal(true);
    }
  };

  const clickDeleteBloco = async (record: DataType) => {
    //deleta os blocos e seus documentos
    try {
      const res = await loadingDocs(record.id);
      if (res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          await deleteDocuments(res[i].id);
        }
      }
      await deleteBloco(record.id);
      message.warning('Bloco excluído');
      const newDocuments = bloco.filter(bloco => bloco.id !== record.id);
      setBloco(newDocuments);
    } catch (error) {
      message.error('Ocorreu um erro ao excluir o bloco.');
    }
  };

  //menu de deletar e editar
  const renderMenu = (record: DataType) => {
    return (
      <Space size="middle">
        <Dropdown
          menu={{
            items: [
              {
                label: 'Alterar',
                key: '1',
                onClick: () => {
                  setRecordBloco(record);
                },
              },
              {
                label: (
                  <Popconfirm
                    title="Tem certeza de que deseja desabilitar este registro de bloco?"
                    onConfirm={() => clickDeleteBloco(record)}
                  >
                    Excluir
                  </Popconfirm>
                ),
                key: '2',
                danger: true,
              },
            ],
            onClick: handleMenuClick,
          }}
        >
          <a onClick={e => e.preventDefault()} className="option">
            <Space>
              <MoreOutlined />
            </Space>
          </a>
        </Dropdown>
      </Space>
    );
  };

  return (
    <>
      <Button
        className="button-criar"
        type="primary"
        onClick={() => {
          setChave('4');
          handleBoletimClick();
        }}
      >
        Voltar
      </Button>
      <Button
        className="button-criar"
        type="primary"
        onClick={() => {
          setShowBlocoModal(true);
        }}
      >
        Criar novo bloco
      </Button>
      {isGeneratingDocument ? (
        <Spin size="small" style={{ marginLeft: '50px' }} />
      ) : (
        <Button
          className="button-criar"
          type="primary"
          onClick={() => {
            loadingData();
          }}
        >
          Gerar documento
        </Button>
      )}

      <List
        itemLayout="horizontal"
        dataSource={bloco}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              className="item-lista"
              avatar={<Avatar src={require('../../assets/ssp-icon.png')} />}
              title={
                <>
                  <div>
                    <Button
                      type="primary"
                      className="button-list"
                      onClick={() => {
                        setChave('6');
                        handleBlocoClick(item.id);
                      }}
                    >
                      {item.name}
                    </Button>
                    <span className="icon-wrapper">{renderMenu(item)}</span>
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
      <ModalBloco
        id={recordBloco?.id}
        boletimId={boletim.id}
        openModal={showBlocoModal}
        closeModal={hideModal}
        updateBlocoList={updateBlocoList}
      />
      <ModalArquivo
        openModal={showArquivoModal}
        closeModal={hideModal}
        boletim={boletim}
        blocos={bloco}
        documents={documents}
        camada={camada}
        classificacao={classificacao}
      />
    </>
  );
}
