import type { Message } from "./ChatSection";

interface Props {
  message: Message;
}

const FileMessage = ({ message }: Props) => {
  const fileUrl = `http://localhost:3000${message.fileUrl}`;

  const isImage = message.fileType?.startsWith("image");
  const isVideo = message.fileType?.startsWith("video");

  return (
    <div className="bg-gray-200 p-2 rounded inline-block max-w-xs">
      {/* IMAGE PREVIEW */}
      {isImage ? (
        <img
          src={fileUrl}
          alt={message.fileName}
          className="max-w-full rounded"
        />
      ) : isVideo ? (
        <video className="max-w-full rounded" controls loop>
            <source src={fileUrl} type="video/mp4"></source>
        </video>
      ) : (
        <div className="flex items-center gap-2">
          📎
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {message.fileName}
          </a>
        </div>
      )}
    </div>
  );
};

export default FileMessage;
