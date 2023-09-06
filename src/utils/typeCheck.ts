export function isArrayOfNumbers(input: any): input is number[] {
  return (
    Array.isArray(input) && input.every((item) => typeof item === 'number')
  );
}
