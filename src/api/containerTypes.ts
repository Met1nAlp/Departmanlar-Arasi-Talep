import { ContainerType } from '../contracts/types';
import { mockContainerTypes } from '../mocks/containerTypes';
import { delay } from './delay';

export async function getContainerTypes(): Promise<ContainerType[]> {
  await delay();
  return mockContainerTypes;
}