import { ThyraAccount } from './ThyraAccount';
import { IAccountDetails } from './../account/IAccountDetails';

const account = new ThyraAccount(
  {
    address: 'AU12EwziCqtDvSkK4CAAVJ6mqUyxvyAebsFTNoCYB5Azq46fhc8bi',
    name: 'name',
  } as IAccountDetails,
  'providerName',
);
