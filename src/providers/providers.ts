
import { providerList } from "./providerList";
import { IProvider } from "src/provider/IProvider";

export async function providers(): Promise<IProvider[]> {
    const providerInstances: IProvider[] = [];

    for (const provider of providerList) {
        try {
            if (await provider.checkInstalled()) {
                provider.isInstalled = true;
                providerInstances.push(provider.createInstance());
            }
        } catch (error) {
            console.error(`Error initializing provider ${provider.name}:`, error);
        }
    }

    return providerInstances;
}