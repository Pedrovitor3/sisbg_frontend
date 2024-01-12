import { Modal, Spin } from 'antd';
import Header from '../../Capas/header';
import { useEffect, useState } from 'react';
import Tabela from '../../Capas/tabela';
import Cabecalho from '../../Capas/cabecalho';
import html2pdf from 'html2pdf.js';
require('./index.css');

type Props = {
  openModal: boolean;
  documents: any;
  blocos: any;
  boletim: any;
  camada: any;
  classificacao: any;
  closeModal: (refresh: boolean) => void;
};

const ModalArquivo = ({
  closeModal,
  openModal,
  documents,
  blocos,
  boletim,
  camada,
  classificacao,
}: Props) => {
  const [url, setUrl] = useState<any>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  let indice = 4;

  const handleOk = (e: any) => {
    e.preventDefault();
  };

  const convertToPDF = async () => {
    //converte o pdf para blob buscando pelo id capa
    setIsLoading(true);

    const element = document.getElementById('capa');

    if (element) {
      //a biblioteca precisa que o componente seja renderizado na tela
      element.style.display = 'block'; // renderiza o html na tela

      const options = {
        margin: 10,
        filename: 'cabecalho.pdf',
        image: { type: 'jpeg', quality: 0.98 } as const,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } as const,
      };

      try {
        //gera um blob
        const pdfBlob = await html2pdf()
          .from(element)
          .set(options)
          .output('blob');

        //gera uma url apartir do blob gerado
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setUrl(pdfUrl);

        element.style.display = 'none'; //retira o elemento da tela
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao converter para PDF:', error);
      }
    } else {
      console.error('Element with ID "pdf-container" not found.');
    }
  };

  useEffect(() => {
    if (openModal) {
      convertToPDF();
    }
  }, [openModal]);

  return (
    <Modal
      visible={openModal}
      title="Boletim Geral"
      okText="Salvar"
      onCancel={() => {
        closeModal(false);
      }}
      onOk={handleOk}
      centered={true}
      footer={null}
      width="900px"
      className="modal-arquivo"
    >
      {isLoading && (
        // Mostra o indicador de carregamento enquanto o PDF está sendo gerado
        <div className="loading-indicator">
          <Spin />
        </div>
      )}
      <div id="capa">
        <Cabecalho numero={boletim?.numero} data={boletim?.data} indice={1} />

        {Array.isArray(blocos) ? (
          blocos.map((blocoItem, index) => {
            let counterClassificacao = 0;

            return (
              <div key={`capa-${index}`} className="page">
                <div className="header-capa">
                  <Header
                    numero={boletim?.numero}
                    data={boletim?.data}
                    indice={indice++}
                  />
                </div>

                <div className="bloco-titulo">
                  {index === 0 && (
                    <div className="bloco-titulo">
                      <p>
                        Para conhecimento desta Instituição e devida execução
                        publique-se o seguinte:
                      </p>
                    </div>
                  )}
                </div>
                <div className="container-part">
                  <h2>
                    {blocoItem.position} - {blocoItem.name}
                  </h2>

                  {documents
                    .filter(
                      (documents: any) => documents.bloco.id === blocoItem.id,
                    )
                    .map((doc: any, filteredIndex: any) => {
                      return <div key={`classificacao-${filteredIndex}`}></div>;
                    })}
                  {classificacao
                    .filter((classificacaoItem: any) => {
                      return documents.some(
                        (doc: any) =>
                          doc.classificacao?.name === classificacaoItem &&
                          doc.bloco.id === blocoItem.id,
                      );
                    })
                    .map((classificacaoItem: any, classificacaoIndex: any) => {
                      let counterCamada = 0;
                      return (
                        <div key={`classificacao-${classificacaoIndex}`}>
                          <h3 className="classificacao">
                            {blocoItem.position}.{++counterClassificacao} -{' '}
                            {classificacaoItem}
                          </h3>
                          {camada
                            .filter((camadaItem: any) => {
                              return documents.some(
                                (doc: any) =>
                                  doc.classificacao?.name ===
                                    classificacaoItem &&
                                  doc.camada?.name === camadaItem &&
                                  doc.bloco.id === blocoItem.id,
                              );
                            })
                            .map(
                              (filteredCamadaItem: any, camadaIndex: any) => (
                                <div key={`camada-${camadaIndex}`}>
                                  <p className="camada">
                                    {blocoItem.position}.{counterClassificacao}.
                                    {++counterCamada}-{filteredCamadaItem}
                                  </p>
                                  {documents.some(
                                    (doc: any) =>
                                      doc.typeDocuments &&
                                      doc.classificacao?.name ===
                                        classificacaoItem &&
                                      doc.camada?.name === filteredCamadaItem &&
                                      doc.bloco.id === blocoItem.id,
                                  ) ? (
                                    <div className="tabela">
                                      <Tabela
                                        documents={documents.filter(
                                          (doc: any) =>
                                            doc.classificacao?.name ===
                                              classificacaoItem &&
                                            doc.camada?.name ===
                                              filteredCamadaItem &&
                                            doc.bloco.id === blocoItem.id,
                                        )}
                                        unidadeBloco={blocoItem.unidade}
                                      />
                                    </div>
                                  ) : (
                                    <p className="sem-alteracao">
                                      - Sem alteração.
                                    </p>
                                  )}
                                  {/*  Aparecer portaria no pdf
                                  {documents.some(
                                    (doc: any) =>
                                      doc.typeDocuments &&
                                      doc.classificacao?.name ===
                                        classificacaoItem &&
                                      doc.camada?.name === filteredCamadaItem &&
                                      doc.bloco.id === blocoItem.id,
                                  ) && (
                                    <div className="pdfs">
                                      {documents.map((doc: any) => {
                                        if (
                                          doc.classificacao?.name ===
                                            classificacaoItem &&
                                          doc.camada?.name ===
                                            filteredCamadaItem &&
                                          doc.bloco.id === blocoItem.id &&
                                          doc.arquivos
                                        ) {
                                          return (
                                            <div key={doc.id}>
                                              {doc.arquivos.map(
                                                (arquivoItem: any) => (
                                                  <div key={arquivoItem.id}>
                                                    <img
                                                      src={arquivoItem.base64}
                                                      alt="PDF Preview"
                                                      style={{
                                                        maxWidth: '700px',
                                                        width: '100%',
                                                        height: 'auto',
                                                        pageBreakInside:
                                                          'avoid',
                                                      }}
                                                    />
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                    )}*/}
                                </div>
                              ),
                            )}
                          {documents.some(
                            (doc: any) =>
                              doc.typeDocuments &&
                              doc.classificacao?.name === classificacaoItem &&
                              doc.camada === null &&
                              doc.bloco.id === blocoItem.id,
                          ) ? (
                            <Tabela
                              documents={documents.filter(
                                (doc: any) =>
                                  doc.typeDocuments &&
                                  doc.classificacao?.name ===
                                    classificacaoItem &&
                                  doc.camada === null &&
                                  doc.bloco.id === blocoItem.id,
                              )}
                              unidadeBloco={blocoItem.unidade}
                            />
                          ) : null}
                          {documents.some(
                            (doc: any) =>
                              doc.classificacao?.name === classificacaoItem &&
                              doc.camada === null &&
                              doc.bloco.id === blocoItem.id &&
                              doc.typeDocuments === null,
                          ) ? (
                            <p className="sem-alteracao">- Sem alteração.</p>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })
        ) : (
          <p>No blocos found.</p>
        )}
      </div>

      <iframe
        title="PDF Viewer"
        name={'Boletim Geral'}
        src={url}
        width="100%"
        className="iframe-arquivo"
      />
    </Modal>
  );
};

export default ModalArquivo;
