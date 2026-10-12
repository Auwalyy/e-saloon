import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph } from 'react-icons/hi';
import { mediaUrl } from '../../services/api';

const MAX_SIZE = 3 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Image picker with preview. Validates type and size in the browser (the API
 * validates again) and hands the chosen File to the parent through `onChange`.
 */
const ImageUpload = ({ label = 'Image', currentUrl, onChange, shape = 'wide' }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  // Release the object URL when it changes or the component unmounts.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return toast.error('Please choose a JPEG, PNG, WebP or GIF image');
    if (file.size > MAX_SIZE) return toast.error('Image is too large (maximum 3 MB)');
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const shown = preview || mediaUrl(currentUrl);
  const frame = shape === 'round' ? 'w-24 h-24 rounded-full' : shape === 'square' ? 'w-28 h-28 rounded-xl' : 'w-full h-40 rounded-xl';

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className={`flex ${shape === 'wide' ? 'flex-col' : 'items-center'} gap-3`}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${frame} relative overflow-hidden border-2 border-dashed border-gray-200 hover:border-gold-500 bg-gray-50 flex items-center justify-center transition-colors shrink-0`}
        >
          {shown ? (
            <img src={shown} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="flex flex-col items-center text-gray-400 text-xs gap-1">
              <HiOutlinePhotograph className="w-7 h-7" />
              Upload
            </span>
          )}
        </button>
        <div className="text-xs text-gray-500">
          <button type="button" onClick={() => inputRef.current?.click()} className="text-gold-700 font-medium hover:underline">
            {shown ? 'Change image' : 'Choose image'}
          </button>
          <p>JPEG, PNG, WebP or GIF, up to 3 MB</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} onChange={handleFile} className="hidden" />
    </div>
  );
};

export default ImageUpload;
