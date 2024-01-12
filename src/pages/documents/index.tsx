import {
  Avatar,
  Button,
  Dropdown,
  List,
  Popconfirm,
  Space,
  message,
} from 'antd';
import {
  deleteDocuments,
  getDocuments,
} from '../../hooks/services/axios/documentsService';
import { useState, useEffect } from 'react';
import ModalDocuments from '../../components/Modal/ModalDocuments';

import { MoreOutlined } from '@ant-design/icons';
require('../index.css');

interface TypeData {
  id: string;
  name: string;
  description: string;
}

interface DataType {
  key: React.Key;
  id: any;
  name: any;
  description: any;
  assunto: any;
  position: any;
  bloco: {
    id: string;
  };
  typeDocuments: TypeData;
  arquivos: any;
}
type DataIndex = keyof DataType;

type Props = {
  setChave: (id: string) => void;
  blocoId: string;
  boletim: string;
};

export default function Documents({ blocoId, boletim, setChave }: Props) {
  const [documents, setDocuments] = useState<DataType[]>([]);

  const [recordDocuments, setRecordDocuments] = useState<any>({});

  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  const updateDocumentsList = (documents: any) => {
    setDocuments(prevDocuments => [...prevDocuments, documents]);
    loadingDocuments();
  };

  const loadingDocuments = async () => {
    try {
      const response = await getDocuments('documents');
      if (response !== false) {
        //filtra documentos do bloco recebido
        const filteredStages = response.data.filter((documents: DataType) => {
          return documents.bloco && documents.bloco.id === blocoId;
        });
        //ordena docs
        const sortedDocuments = filteredStages.sort((a: any, b: any) => {
          return parseInt(a.position, 10) - parseInt(b.position, 10);
        });

        setDocuments(sortedDocuments);
      } else {
        message.error('Ocorreu um erro inesperado ao obter os documentos.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter os documentos.');
    }
  };

  const hideModal = (refresh: boolean) => {
    setShowDocumentsModal(false);

    setRecordDocuments(null);
    loadingDocuments();
    if (refresh) setDocuments([]);
  };

  const handleBoletimClick = () => {
    setChave('5');
  };

  const handleMenuClick = (e: any) => {
    if (e.key === '1') {
      setShowDocumentsModal(true);
    }
  };

  const clickDeleteDocuments = async (record: DataType) => {
    try {
      await deleteDocuments(record.id);
      const newDocuments = documents.filter(
        document => document.id !== record.id,
      );
      setDocuments(newDocuments);
      message.warning('Documento excluído');
    } catch (error) {
      message.error('Ocorreu um erro ao excluir o documento.');
    }
  };

  const renderMenu = (record: any) => {
    return (
      <Space size="middle">
        <Dropdown
          menu={{
            items: [
              {
                label: 'Alterar',
                key: '1',
                onClick: () => {
                  setRecordDocuments(record);
                },
              },
              {
                label: (
                  <Popconfirm
                    title="Tem certeza de que deseja desabilitar este registro de documento?"
                    onConfirm={() => clickDeleteDocuments(record)}
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

  useEffect(() => {
    setShowDocumentsModal(false);
    loadingDocuments();
  }, []);

  return (
    <>
      <Button
        className="button-criar"
        type="primary"
        onClick={() => {
          setChave('5');
          handleBoletimClick();
        }}
      >
        Voltar
      </Button>
      <Button
        className="button-criar"
        type="primary"
        onClick={() => {
          setShowDocumentsModal(true);
        }}
      >
        Criar novo documento
      </Button>

      <List
        itemLayout="horizontal"
        dataSource={documents}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              className="item-lista"
              avatar={<Avatar src={require('../../assets/ssp-icon.png')} />}
              title={
                <>
                  <div className="button-container">
                    <Button
                      type="primary"
                      className="button-list"
                      onClick={() => {
                        setShowDocumentsModal(true);
                        setRecordDocuments(item);
                      }}
                    >
                      {item.name}
                    </Button>

                    <span className="icon-wrapper">{renderMenu(item)}</span>
                  </div>
                </>
              }
              description={item.assunto}
            />
          </List.Item>
        )}
      />
      <ModalDocuments
        id={recordDocuments?.id}
        blocoId={blocoId}
        openModal={showDocumentsModal}
        closeModal={hideModal}
        updateDocumentsList={updateDocumentsList}
      />
    </>
  );
}
