/**
 * Represents the object used to register an event.
 */
export interface IRegisterEvent {
  /** Name of the provider associated with the event. */
  providerName: string;

  /** Target associated with the event. */
  eventTarget: string;
}
