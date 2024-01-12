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
import {
  deleteBoletim,
  getBoletim,
} from '../../hooks/services/axios/boletimService';
import { useState, useEffect } from 'react';
import { MoreOutlined } from '@ant-design/icons';
import ModalBoletim from '../../components/Modal/ModalBoletim';
import {
  deleteDocuments,
  getDocuments,
} from '../../hooks/services/axios/documentsService';
import { deleteBloco, getBloco } from '../../hooks/services/axios/blocoService';

require('../index.css');

interface BoletimData {
  id: any;
  name: any;
  description: any;
  data: any;
}

type Props = {
  setChave: (id: string) => void;
  onBoletimChange: (boletim: any) => void;
};

export default function Board({ setChave, onBoletimChange }: Props) {
  const [boletim, setBoletim] = useState<BoletimData[]>([]);
  const [showBoletimModal, setShowBoletimModal] = useState(false);
  const [recordBoletim, setRecordBoletim] = useState<any>({});

  const [isDeleting, setIsDeleting] = useState(false);

  const updateBoletimList = (boletim: any) => {
    setBoletim(prevBoletim => [...prevBoletim, boletim]);
    loadingBoletim();
  };

  const loadingBoletim = async () => {
    try {
      const response = await getBoletim(`boletim`);
      if (response !== false) {
        setBoletim(response.data);
      } else {
        message.error('Ocorreu um erro inesperado ao obter os boletins.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter os boletins.');
    }
  };

  //abrir pagina blocos do boletim
  const handleBoletimClick = (boletim: any) => {
    setChave('5');
    onBoletimChange(boletim);
  };

  const handleMenuClick = (e: any) => {
    if (e.key === '1') {
      setShowBoletimModal(true);
    }
  };

  const loadingDocs = async (blocoId: any) => {
    try {
      const response = await getDocuments('documents');
      if (response !== false) {
        //filtra os documentos do bloco
        const filteredStages = response.data.filter((documents: any) => {
          return documents.bloco && documents.bloco.id === blocoId;
        });
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

  const loadingblocos = async (boletimId: any) => {
    try {
      const blocoResponse = await getBloco('bloco');
      if (blocoResponse !== false) {
        //filtra os blocos do boletim
        const filteredBlocos = blocoResponse.data.filter((bloco: any) => {
          return bloco.boletim && bloco.boletim.id === boletimId;
        });

        const sortedBlocos = filteredBlocos.sort((a: any, b: any) => {
          return parseInt(a.position, 10) - parseInt(b.position, 10);
        });

        return sortedBlocos;
      } else {
        message.error('Ocorreu um erro inesperado ao obter os blocos.');
      }
    } catch (error) {
      message.error('Ocorreu um erro inesperado ao obter os dados.');
    }
  };

  const clickDeleteBoletim = async (record: BoletimData) => {
    //deleta o boletim e seus blocos e documentos dos blocos
    setIsDeleting(true);

    try {
      const blocos = await loadingblocos(record.id);
      if (blocos.length > 0) {
        for (let i = 0; i < blocos.length; i++) {
          const docs = await loadingDocs(blocos[i].id);

          if (docs.length > 0) {
            for (let i = 0; i < docs.length; i++) {
              await deleteDocuments(docs[i].id);
            }
          }
          await deleteBloco(blocos[i].id);
        }
      }

      await deleteBoletim(record.id);
      setIsDeleting(false);
      message.warning('Boletim Exclído');
      const newBoletim = boletim.filter(boletim => boletim.id !== record.id);
      setBoletim(newBoletim);
    } catch (error) {
      setIsDeleting(false);

      message.error('Ocorreu um erro ao excluir o bloco.');
    }
  };

  const hideModal = (refresh: boolean) => {
    setShowBoletimModal(false);
    setRecordBoletim(null);
    if (refresh) setBoletim([]);
  };

  useEffect(() => {
    setShowBoletimModal(false);
    loadingBoletim();
  }, []);

  //menu editar e deletar
  const renderMenu = (record: BoletimData) => {
    return (
      <Space size="middle">
        <Dropdown
          menu={{
            items: [
              {
                label: 'Alterar',
                key: '1',
                onClick: () => {
                  setRecordBoletim(record);
                },
              },
              {
                label: (
                  <Popconfirm
                    title="Tem certeza de que deseja desabilitar este boletim?"
                    onConfirm={() => clickDeleteBoletim(record)}
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
          setShowBoletimModal(true);
        }}
      >
        Criar Boletim Geral
      </Button>
      <List
        className="lista"
        itemLayout="horizontal"
        dataSource={boletim}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              className="item-lista"
              avatar={<Avatar src={require('../../assets/ssp-icon.png')} />}
              title={
                <div>
                  <Button
                    type="primary"
                    className="button-list"
                    onClick={() => {
                      handleBoletimClick(item);
                    }}
                  >
                    {item.name}
                  </Button>
                  {isDeleting ? (
                    <Spin size="small" style={{ marginLeft: '50px' }} />
                  ) : (
                    <span className="icon-wrapper">{renderMenu(item)}</span>
                  )}
                </div>
              }
              description={item.description}
            />
          </List.Item>
        )}
      />
      <ModalBoletim
        updateBoletimList={updateBoletimList}
        id={recordBoletim?.id}
        closeModal={hideModal}
        openModal={showBoletimModal}
      />
    </>
  );
}
