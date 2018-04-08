import { ComputationRef } from './ComputationRef';
import { mount } from 'enzyme';
import { observable } from './observable';
import { ReactiveComponent } from './ReactiveComponent';
import * as React from 'react';

interface Props {
  other: number
  end: string
}

class TestComponent extends ReactiveComponent<Props> {
  name = 'testComponent';

  @observable
  message = 'hello'

  renderCount = 0;

  @observable
  text = '';

  construct(computation: ComputationRef) {
    this.text = this.message + this.props.end;
  }

  compute() {
    this.renderCount += 1;
    return <div>{this.text}</div>;
  }
}

describe('ReactiveComponent', () => {
  it('should automatically update when observable changes', () => {
    const wrapper = mount(<TestComponent end="!" other={0} />);
    const inst = wrapper.instance() as TestComponent;
    expect(wrapper.html()).toBe('<div>hello!</div>');
    inst.message = 'goodbye';
    expect(wrapper.html()).toBe('<div>goodbye!</div>');
    expect(inst.renderCount).toBe(2);
    wrapper.unmount();
  });

  it('should automatically update when props change', () => {
    const wrapper = mount(<TestComponent end="!" other={0} />);
    const inst = wrapper.instance() as TestComponent;
    expect(wrapper.html()).toBe('<div>hello!</div>');
    wrapper.setProps({ other: 42 });
    wrapper.setProps({ end: '.' });
    expect(wrapper.html()).toBe('<div>hello.</div>');
    // Render count should be 2 because the 'other' property is not used.
    expect(inst.renderCount).toBe(2);
    wrapper.unmount();
  });
});
