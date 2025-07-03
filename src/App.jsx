
import {useState, useEffect, useRef} from 'react'
import './App.css'
import WebTorrent from 'webtorrent'

function App() {
    const [torrents, setTorrents] = useState([])
    const [selectedFiles, setSelectedFiles] = useState([])
    const [client, setClient] = useState(null)

    const fileInputRef = useRef(null)

    useEffect(() => {
        const webTorrentClient = new WebTorrent()
        setClient(webTorrentClient)

        const interval = setInterval(() => {
            const updatedTorrents = webTorrentClient.torrents.map(torrent => ({
                name: torrent.name,
                infoHash: torrent.infoHash,
                magnetUri: torrent.magnetURI,
                progress: Math.round(torrent.progress * 100),
                uploadSpeed: Math.round(torrent.uploadSpeed / 1024),
                peers: torrent.numPeers,
                torrentObj: torrent
            }))

            setTorrents(updatedTorrents)
        }, 1000)

        return () => {
            if (webTorrentClient) {
                webTorrentClient.destroy()
            }
            clearInterval(interval)
        }
    }, [])

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files)
        setSelectedFiles(files)
    }

    const startUpload = () => {
        if (!client || selectedFiles.length === 0) return

        selectedFiles.forEach(file => {
            const initialTorrent = {
                name: file.name,
                infoHash: '',
                magnetUri: '',
                progress: 0,
                uploadSpeed: 0,
                peers: 0,
                torrentObj: null
            }

            setTorrents(prev => [...prev, initialTorrent])

            client.seed(file, (torrent) => {
                console.log(`Torrent criado para ${file.name}`)
            })
        })

        setSelectedFiles([])
        fileInputRef.current.value = null
    }

    const copyMagnetLink = async (magnetUri) => {
        try {
            await navigator.clipboard.writeText(magnetUri)
            alert('Magnet link copiado para a área de transferência!')
        } catch (err) {
            console.error('Erro ao copiar magnet link:', err)
        }
    }

    const removeTorrent = (torrent) => {
        if (torrent.torrentObj) {
            torrent.torrentObj.destroy()
        }
        setTorrents(prev => prev.filter(t => t.magnetUri !== torrent.magnetUri))
    }

    const downloadTorrentFile = (torrent) => {
        const blob = new Blob([torrent.torrentObj.torrentFile], {
            type: 'application/x-bittorrent'
        })

        const url = window.URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${torrent.name}.torrent`

        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    return (
        <div className="container">
            <h1>WebTorrent Upload Manager</h1>

            <section className="upload-section">
                <h2>Adicionar Arquivos</h2>
                <div className="upload-area">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="file-input"
                        ref={fileInputRef}
                    />

                    <button
                        className="upload-button"
                        onClick={startUpload}
                        disabled={selectedFiles.length === 0}
                    >
                        Iniciar Upload
                    </button>
                </div>
                <div>
                    {selectedFiles.map((file, index) => (
                        <li key={index} className="file-item">
                            <span>{file.name}</span>
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </li>
                    ))}
                </div>
            </section>

            <section className="active-torrents">
                <h2>Torrents Ativos</h2>
                <div className="torrents-list">
                    {torrents.map((torrent, index) => (
                        <div key={torrent.infoHash || index} className="torrent-item">
                            <div className="torrent-info">
                                <h3>{torrent.name}</h3>
                                <div className="progress-bar">
                                    <div
                                        className="progress"
                                        style={{ width: `${torrent.progress}%` }}
                                    ></div>
                                </div>
                                <div className="torrent-stats">
                                    <span>Progresso: {torrent.progress}%</span>
                                    <span>Velocidade: {torrent.downloadSpeed} KB/s</span>
                                    <span>Peers: {torrent.peers}</span>
                                </div>
                            </div>
                            <div className="torrent-actions">
                                {torrent.magnetUri && (
                                    <button
                                        className="action-button"
                                        onClick={() => copyMagnetLink(torrent.magnetUri)}
                                    >
                                        Copiar Magnet Link
                                    </button>
                                )}
                                {torrent.torrentObj && torrent.torrentObj.torrentFile && (
                                    <button
                                        className="action-button download"
                                        onClick={() => downloadTorrentFile(torrent)}
                                    >
                                        Baixar .torrent
                                    </button>
                                )}
                                <button
                                    className="action-button remove"
                                    onClick={() => removeTorrent(torrent)}
                                >
                                    Remover
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default App
