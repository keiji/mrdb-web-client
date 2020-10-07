import { Rectangle } from '../Rectangle';
import { convertRegionsToPathRegions, Region } from '../Region';
import { Category } from '../Category';
import { Label } from '../Label';

const BASE_API_ENDPOINT = 'https://crdb.keiji.dev/api/v1'

export async function fetchHash(imageFile: File) {
  const formData = new FormData();
  formData.append('file', imageFile);
  const response = await fetch(BASE_API_ENDPOINT + "/hash", { method: 'POST', body: formData });
  return response.json();
}

const handleErrors = (response: any) => {
  if (response.ok) {
    return response;
  }

  switch (response.status) {
    case 400: throw Error('INVALID_TOKEN');
    case 401: throw Error('UNAUTHORIZED');
    case 500: throw Error('INTERNAL_SERVER_ERROR');
    case 502: throw Error('BAD_GATEWAY');
    case 404: throw Error('NOT_FOUND');
    default: throw Error('UNHANDLED_ERROR');
  }
};

export async function fetchCategories() {
  const response = await fetch(BASE_API_ENDPOINT + "/category")
    .catch((e) => { throw Error(e); })
    .then(handleErrors);
  const jsonObj = await response.json();
  const categories = jsonObj['categories'].map((categoryObj: any) => {
    const id = categoryObj['id'];
    const name = categoryObj['name'];
    const order = categoryObj['order'];
    return new Category(id, name, order);
  });

  return categories;
}

export async function fetchLabels(categoryId: number) {
  const response = await fetch(BASE_API_ENDPOINT + `/category/${categoryId}`)
    .catch((e) => { throw Error(e); })
    .then(handleErrors);
  const jsonObj = await response.json();
  const labels = jsonObj['labels'].map((labelObj: any) => {
    const categoryId = labelObj['category_id'];
    const label = labelObj['label'];
    const name = labelObj['name'];
    const order = labelObj['order'];
    return new Label(categoryId, label, name, order);
  });

  return labels;
}

function horizontalPoints(points: Array<{}>): Array<number> {
  return points.map((point: any) => {
    return point['x'] as number
  });
}

function verticalPoints(points: Array<{}>): Array<number> {
  return points.map((point: any) => {
    return point['y'] as number
  });
}

export function fetchPageRegionsUrl(imageIds: {}) {
  return BASE_API_ENDPOINT + "/page/" + imageIds['dhash8'];
}

export async function fetchPageRegions(imageIds: {}) {
  const response = await fetch(fetchPageRegionsUrl(imageIds))
    .catch((e) => { throw Error(e); })
    .then(handleErrors);
  const jsonObj = await response.json();

  const regions = jsonObj['regions'].map((regionObj: any) => {
    const categoryId = regionObj['category_id'];
    const label = regionObj['label'];

    const horizontalPointList = horizontalPoints(regionObj['points']);
    const verticalPointList = verticalPoints(regionObj['points']);

    const left = Math.min(...horizontalPointList);
    const top = Math.min(...verticalPointList);
    const right = Math.max(...horizontalPointList);
    const bottom = Math.max(...verticalPointList);

    const rectangle = new Rectangle()
    rectangle.left = left;
    rectangle.top = top;
    rectangle.right = right;
    rectangle.bottom = bottom;
    rectangle.validate()

    return new Region(categoryId, label, rectangle);
  });

  return {
    hashes: imageIds,
    regions: regions
  };
}

export async function submitPageRegions(idempotencyKey: string, hashes: {}, regions: Array<Region>) {

  const regionsObj = convertRegionsToPathRegions(regions);
  const jsonObj = {
    "image_ids": {
      "dhash8": hashes["dhash8"],
      "dhash12": hashes["dhash12"],
      "dhash16": hashes["dhash16"],
    },
    "regions": regionsObj
  };

  const body: string = JSON.stringify(jsonObj);

  const response = await fetch(BASE_API_ENDPOINT + "/page", {
    method: 'POST',
    headers: {
      "Idempotency-Key": idempotencyKey
    },
    body: body
  });
  return response.json();

}