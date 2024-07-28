import { invoke } from '@tauri-apps/api';
import React, { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event'

import LogsViewer from './LogsViewer';
import { IconDocker, IconBxTrashAlt, IconPlayCircle, IconBxTerminal, IconRestart, IconWeb, IconCircleStop } from '../icons';
import { toast } from 'react-toastify';

function DetailsPanel({ selectedContainer }) {
  const [activeTab, setActiveTab] = useState('LOGS');

  const [info, setInfo] = useState("")

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (selectedContainer) {
      setLogs([]); // Clear logs before subscribing

      const unlisten = listen('log_chunk', (event) => {

        const sanitizedLog = sanitizeLog(event.payload);
        setLogs((prevLogs) => [...prevLogs, sanitizedLog]);
      });

      invoke('stream_docker_logs', { containerId: selectedContainer.Id });

      return () => {
        unlisten.then(f => f());
      };
    }

  }, [selectedContainer]);


  function getInfo() {
    invoke('fetch_container_info', { cId: selectedContainer.Id }).then((info) => {
      setInfo(info)
    });
  }

  function sanitizeLog(log) {
    // Remove control characters and non-printable characters
    return log.replace(/[\x00-\x1F\x7F]/g, "");
  }

  const isWeb = () => {

    return selectedContainer.Ports.length > 0 && selectedContainer.Ports[0].PublicPort !== null
  }

  function containerOperation(actionType) {
    invoke('container_operation', { cId: selectedContainer.Id, opType: actionType }).then((res) => {

      if (res) {
        toast(res)
      }

    }).then((e) => {
      toast.error(e)
    });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'LOGS':
        return <LogsViewer logs={logs} />

      case 'INFO':
        return <div>{info}</div>;
      case 'STATS':
        return <div>Stats content here</div>;
      default:
        return null;
    }
  };

  if (!selectedContainer) {
    return <div className="text-gray-600 p-4 shadow-sm rounded-md h-full overflow-x-hidden flex flex-col md:items-center md:justify-center">

      <div>
        <IconDocker className="size-20 opacity-75" fill="" />
      </div>
      Select a container to see more details
    </div>
  }

  return (
    <div className="dark p-4 bg-white shadow-sm rounded-md h-full overflow-x-hidden flex flex-col">
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-bold">{selectedContainer.Names[0].slice(1)}</h1>
        <p className="ml-auto text-sm text-gray-600">Status: {selectedContainer.Status}</p>
      </div>
      <div className="flex mb-4">
        <div className="tooltip tooltip-bottom hover:tooltip-open" data-tip="Web">
          <button className="btn btn-square btn-sm mr-3"
            disabled={!isWeb()}
            onClick={() => containerOperation("web")}
          >
            <IconWeb className="size-5" />
          </button>
        </div>
        <div className="tooltip tooltip-bottom hover:tooltip-open" data-tip="Open Terminal">
          <button className="btn btn-square btn-sm mr-3"
            onClick={() => containerOperation("exec")}
          >
            <IconBxTerminal className="size-5" />
          </button>
        </div>

        <div className="tooltip tooltip-bottom hover:tooltip-open" data-tip={selectedContainer.Status.toLowerCase().includes("up") ? "Stop" : "Start"}>
          {selectedContainer.Status.toLowerCase().includes("up") ?
            <button className="btn btn-square btn-sm mr-3"
              onClick={() => containerOperation("stop")}
            >
              <IconCircleStop className="size-5" />
            </button>
            : <button className="btn btn-square btn-sm mr-3"
              onClick={() => containerOperation("start")}
            >
              <IconPlayCircle className="size-5" />
            </button>
          }
        </div>

        <div className="tooltip tooltip-bottom hover:tooltip-open" data-tip="Restart">
          <button className="btn btn-square btn-sm mr-3"
            onClick={() => containerOperation("restart")}
          >
            <IconRestart className="size-5" />
          </button>
        </div>

        <div className="tooltip tooltip-bottom hover:tooltip-open" data-tip="Delete">
          <button className="btn btn-square btn-sm btn-error mr-3"
            onClick={() => containerOperation("delete")}
          >
            <IconBxTrashAlt className="size-5" />

          </button>
        </div>

      </div>
      <div className="flex mb-4 border-b">
        <button className={`mr-4 pb-2 ${activeTab === 'LOGS' ? 'border-b-2 border-blue-500' : ''}`} onClick={() => setActiveTab('LOGS')}>LOGS</button>
        <button className={`pb-2 mr-4 ${activeTab === 'INFO' ? 'border-b-2 border-blue-500' : ''}`} onClick={() => setActiveTab('INFO')}>INFO</button>
        <button className={`mr-4 pb-2 ${activeTab === 'STATS' ? 'border-b-2 border-blue-500' : ''}`} onClick={() => setActiveTab('STATS')}>STATS</button>
      </div>
      <div className="flex-1 overflow-auto text-white p-2 rounded">
        {renderContent()}
      </div>
    </div >
  );
}

export default DetailsPanel;
