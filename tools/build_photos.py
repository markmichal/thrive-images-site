"""Build data/photos.json and small preview pictures from the THRIVE IMAGES Drive folder.

Reads the folder through Google Drive for desktop (each synced file carries its Drive ID),
so it needs this Mac with Drive running. Re-run after adding or renaming photos in Drive.

Run: python3 tools/build_photos.py
"""
import json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FOLDER = os.path.expanduser('~/Library/CloudStorage/GoogleDrive-mark.michal@cru.org/My Drive/CRU/EVENTS & PROJECTS/'
                            '2026-2027/THRIVE Group/THRIVE Main Files/Other Files/Other Images/THRIVE IMAGES')
FOLDER_ID = '1JXUgTYmMtGrY4TDu7xxPokq33qdJnnBD'
THUMBS = os.path.join(ROOT, 'photos')


def drive_id(path):
    out = subprocess.run(['xattr', '-p', 'com.google.drivefs.item-id#S', path], capture_output=True, text=True)
    return out.stdout.strip()


def size(path):
    out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path], capture_output=True, text=True).stdout
    nums = re.findall(r'pixel\w+: (\d+)', out)
    return (int(nums[0]), int(nums[1])) if len(nums) == 2 else (0, 0)


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') or 'photo'


def main():
    os.makedirs(THUMBS, exist_ok=True)
    keep = set()
    photos = []
    for f in sorted(os.listdir(FOLDER), key=str.lower):
        path = os.path.join(FOLDER, f)
        if f.startswith('.') or not re.search(r'\.(jpe?g|png)$', f, re.I):
            continue
        fid = drive_id(path)
        w, h = size(path)
        thumb = slug(os.path.splitext(f)[0]) + '.jpg'
        keep.add(thumb)
        tpath = os.path.join(THUMBS, thumb)
        if not os.path.exists(tpath) or os.path.getmtime(tpath) < os.path.getmtime(path):
            subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '70', '-Z', '480', path, '--out', tpath],
                           capture_output=True)
        photos.append({'file': f, 'id': fid, 'w': w, 'h': h, 'bytes': os.path.getsize(path), 'thumb': 'photos/' + thumb})
    for old in os.listdir(THUMBS):
        if old not in keep:
            os.remove(os.path.join(THUMBS, old))
    json.dump({'folderId': FOLDER_ID, 'photos': photos}, open(os.path.join(ROOT, 'data', 'photos.json'), 'w'), indent=1, ensure_ascii=False)
    missing = [p['file'] for p in photos if not p['id']]
    print(f'{len(photos)} photos' + (f', no Drive ID for: {missing}' if missing else ''))


if __name__ == '__main__':
    main()
